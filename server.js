const pino = require('pino');
const axios = require('axios');
const Joi = require('@hapi/joi');
const { createError, json, send } = require('micro');

const plugins = require('./plugins');

if (!process.env.apikey) throw new Error('ENV apikey is missing!');
if (!process.env.traefik_network) throw new Error('ENV traefik_network is missing!');

const defaultLabels = {
  'traefik.enable': 'true',
};

/*
  Define Schemas
*/
const startSchema = Joi.object({
  image: Joi.string()
    .regex(new RegExp(/^[^<>;\\]*$/))
    .required(),
  hostname: Joi.string()
    .hostname()
    .required(),
  env: Joi.array().items(Joi.string()),
  additionalLabels: Joi.object(),
  keepImage: Joi.boolean().default(false),
}).required();

const stopSchema = Joi.object({
  hostname: Joi.string()
    .hostname()
    .required(),
  keepImage: Joi.boolean().default(false),
}).required();

/*
  Setup Logger
*/
const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});
global.logger = logger;
logger.info(`Node-ENV: ${process.env.NODE_ENV}`);

/*
  Bootstrap Plugin Module
*/
plugins.bootstrap();

/*
  Setup Docker Interface
*/
const headers = {};
logger.info('Setup Docker Interface');
// eslint-disable-next-line max-len
if (process.env.registry_username && process.env.registry_password) {
  logger.info('Set Registry Credentails');
  const registryAuth = Buffer.from(JSON.stringify({
    username: process.env.registry_username,
    password: process.env.registry_password,
  })).toString('base64');
  headers['X-Registry-Auth'] = registryAuth;
} else logger.info('No Registry Credentails found');

const docker = axios.create({
  socketPath: '/var/run/docker.sock',
  headers,
});

/*
  Define Error Hander
*/
// eslint-disable-next-line consistent-return
const handleErrors = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (err) {
    if (err.response && err.response.data) logger.error(err.response.data);
    logger.info(`[${err.statusCode}] ${err.message}`);
    if (err.name === 'ValidationError') {
      send(res, 400, { message: err.message, errors: err.details });
    } else {
      try {
        await plugins.failure(err, { ...await json(req), action: req.action });
      } catch (error) {
        logger.warn(error);
      } finally {
        send(res, err.statusCode || 500, { message: err.message });
      }
    }
  }
};

const checkApiKey = (req) => {
  logger.debug('Check API-Key');
  logger.debug(`API-Key: ${process.env.apikey}`);
  logger.debug(`Auth-Header: ${req.headers.authorization}`);
  if (process.env.apikey !== req.headers.authorization) throw createError(401, 'Authentication failed');
};

const startApp = async (req, res) => {
  const body = await startSchema.validateAsync(await json(req), { abortEarly: false });
  logger.debug(JSON.stringify(body));
  await plugins.preDeployment({ ...body, action: req.action });
  logger.info(`Start Deployment: '${body.image}' => '${body.hostname}'`);
  // Check if Container for given Hostname already exists
  let blueGreenDeployment = false;
  try {
    await docker.get(`http:/containers/${body.hostname}/json`);
    logger.info(`Container for '${body.hostname}' already exists. Existing Container will be replaced.`);
    blueGreenDeployment = true;
  } catch (error) {
    if (error.response.status === 404) {
      logger.info(`No existing Container for '${body.hostname}' found. No Replacement needed.`);
    } else throw createError(500, 'Unkown error', error);
  }
  // Rename existing Container
  if (blueGreenDeployment) {
    logger.info('Rename existing Container.');
    await docker.post(`http:/containers/${body.hostname}/rename?name=${body.hostname}-old`);
  }
  // Pull Image and create container
  try {
    // Pull Image
    try {
      logger.info(`Pull Image '${body.image}'.`);
      await docker.post(`http:/images/create?fromImage=${body.image}`);
      logger.info(`Create Container '${body.hostname}'.`);
    } catch (error) {
      if (error.response.status === 404) throw createError(404, `Image ${body.image} not found`, error);
      else throw createError(500, `Pull Image ${body.image} failed due to unkown error`, error);
    }
    // Create Container
    const Labels = {
      ...defaultLabels,
      ...body.additionalLabels,
    };
    Labels[`traefik.http.routers.${body.hostname.replace(/\./g, '-')}.rule`] = `Host(\`${body.hostname}\`)`;
    if (process.env.traefik_certresolver) {
      Labels[`traefik.http.routers.${body.hostname.replace(/\./g, '-')}.tls`] = 'true';
      Labels[`traefik.http.routers.${body.hostname.replace(/\./g, '-')}.tls.certresolver`] = process.env.traefik_certresolver;
    }
    const Env = body.env || [];
    await docker.post(`http:/containers/create?name=${body.hostname}`, {
      Hostname: body.hostname,
      Image: body.image,
      Labels,
      Env,
      NetworkMode: process.env.traefik_network,
    });
  } catch (error) {
    logger.error('Creating the new Container failed!');
    if (blueGreenDeployment) {
      // Rollback
      logger.warn('Already existing Container will be renamed back.');
      await docker.post(`http:/containers/${body.hostname}-old/rename?name=${body.hostname}`);
    }
    throw error;
  }

  try {
    logger.info(`Start Container '${body.hostname}'.`);
    await docker.post(`http:/containers/${body.hostname}/start`);
  } catch (error) {
    logger.error('Starting new Container failed!');
    logger.warn('New created Container will be removed.');
    await docker.delete(`http:/containers/${body.hostname}?force=true`);
    if (blueGreenDeployment) {
      // Rollback
      logger.warn('Already existing Container will be renamed back.');
      await docker.post(`http:/containers/${body.hostname}-old/rename?name=${body.hostname}`);
    }
    throw createError(500, `Starting Container '${body.hostname}' failed due to unkown error`, error);
  }

  if (blueGreenDeployment) {
    try {
      const { data: newContainer } = await docker.get(`http:/containers/${body.hostname}/json`);
      const { data: oldContainer } = await docker.get(`http:/containers/${body.hostname}-old/json`);
      logger.info(`Remove old Container ${body.hostname}-old.`);
      await docker.delete(`http:/containers/${body.hostname}-old?force=true`);

      if (body.keepImage === false) {
        // Remove Image of old Container if diff to Image of new Container
        logger.debug(`Ìmage of new Container ${newContainer.Image}, Image of old Container ${oldContainer.Image}`);
        if (newContainer.Image !== oldContainer.Image) {
          logger.info(`Remove '${oldContainer.Image.replace('sha256:', '')}' Image.`);
          try {
            await docker.delete(`http:/images/${oldContainer.Image.replace('sha256:', '')}`);
          } catch (error) {
            logger.error(`Revmoving Image failed: ${error.response.data}`);
          }
        }
      } else logger.info('Skipping "Image removing"');
    } catch (error) {
      logger.warn(`Removing old Container '${body.hostname}-old' failed: ${error}`);
    }
  }
  await plugins.postDeployment({ ...body, action: req.action });
  logger.info(`Deployment is done: ${body.hostname}`);
  res.end(`Deployment is done: ${body.hostname}`);
};
const stopApp = async (req, res) => {
  const body = await stopSchema.validateAsync(await json(req), { abortEarly: false });
  logger.debug(JSON.stringify(body));
  await plugins.preTeardown({ ...body, action: req.action });
  logger.info(`Start Teardown: '${body.hostname}'.`);
  try {
    const { data: oldContainer } = await docker.get(`http:/containers/${body.hostname}/json`);
    logger.info(`Stop and remove '${body.hostname}' Container.`);
    await docker.delete(`http:/containers/${body.hostname}?force=true`);

    if (body.keepImage === false) {
      // Remove Image of old Container
      logger.info(`Remove '${oldContainer.Image.replace('sha256:', '')}' Image.`);
      try {
        await docker.delete(`http:/images/${oldContainer.Image.replace('sha256:', '')}`);
      } catch (error) {
        logger.error(`Revmoving Image failed: ${error.response.data}`);
      }
    } else logger.info('Skipping "Image removing"');
    await plugins.postTeardown({ ...body, action: req.action });
    logger.info(`Teardown is done: ${body.hostname}`);
    res.end(`Teardown is done: ${body.hostname}`);
  } catch (error) {
    if (error.response.status === 404) {
      throw createError(404, `Container '${body.hostname}' not found`, error);
    } else throw createError(500, `Teardown of '${body.hostname}' failed due to unkown error`, error);
  }
};

module.exports = handleErrors(async (req, res) => {
  logger.info(`New Request: ${req.url}`);
  checkApiKey(req);

  switch (req.url) {
    case '/start':
    case '/deploy':
      req.action = 'deployment';
      await startApp(req, res);
      break;
    case '/stop':
    case '/teardown':
      req.action = 'teardown';
      await stopApp(req, res);
      break;
    default:
      throw createError(404, 'Not found');
  }
});
