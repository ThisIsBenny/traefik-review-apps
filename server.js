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
}).required();

const stopSchema = Joi.object({
  hostname: Joi.string()
    .hostname()
    .required(),
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
plugins.bootstrap(logger);

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
    logger.debug(JSON.stringify(err));
    if (err.response && err.response.data) logger.error(JSON.stringify(err.response.data));
    logger.info(`[${err.statusCode}] ${err.message}`);
    logger.debug(err.name);
    if (err.name === 'ValidationError') {
      send(res, 400, { message: err.message, errors: err.details });
    } else {
      plugins.failure(err);
      send(res, err.statusCode || 500, { message: err.message });
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
  plugins.pre(body);
  logger.info(`Start App: ${body.image} => ${body.hostname}`);
  try {
    logger.info('Remove old Container...');
    await docker.delete(`http:/containers/${body.hostname}?force=true`);
    logger.info('Old Container removed');
  } catch (error) {
    if (error.response.status === 404) logger.info(`Old Container ${body.hostname} not found.`);
    else throw error;
  }
  logger.info('Pull Image...');
  await docker.post(`http:/images/create?fromImage=${body.image}`);
  logger.info('Create Container...');

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
  const { data } = await docker.post(`http:/containers/create?name=${body.hostname}`, {
    Hostname: body.hostname,
    Image: body.image,
    Labels,
    Env,
    NetworkMode: process.env.traefik_network,
  });
  logger.debug(JSON.stringify(data));
  logger.info(`Container created: ${data.Id}`);
  logger.info('Start Container...');
  await docker.post(`http:/containers/${data.Id}/start`);
  logger.info('Container started');
  plugins.post(body);
  res.end(`App is running: ${body.hostname}`);
};
const stopApp = async (req, res) => {
  const body = await stopSchema.validateAsync(await json(req), { abortEarly: false });
  logger.info(`Stop App: ${body.hostname}`);
  logger.info('Remove Container...');
  try {
    await docker.delete(`http:/containers/${body.hostname}?force=true`);
    logger.info('Container removed');
    res.end(`App is stopped: ${body.hostname}`);
  } catch (error) {
    if (error.response.status === 404) {
      logger.info(`App ${body.hostname} not found.`);
      res.end(`App ${body.hostname} not found.`);
    } else throw error;
  }
};

module.exports = handleErrors(async (req, res) => {
  logger.info(`New Request: ${req.url}`);
  checkApiKey(req);

  switch (req.url) {
    case '/start':
      await startApp(req, res);
      break;
    case '/stop':
      await stopApp(req, res);
      break;
    default:
      throw createError(404, 'Not found');
  }
});
