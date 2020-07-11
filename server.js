const pino = require('pino');
const axios = require('axios');
const { createError, json, send } = require('micro');

if (!process.env.apikey) throw new Error('ENV apikey is missing!');
if (!process.env.traefik_network) throw new Error('ENV traefik_network is missing!');

const defaultLabels = {
  'traefik.enable': 'true',
};

/*
  Setup Logger
*/
const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
});

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
    if (err.response.data) logger.error(JSON.stringify(err.response.data));
    logger.info(`[${err.statusCode}] ${err.message}`);
    send(res, 500, { message: err.message });
  }
};

const checkApiKey = (req) => {
  logger.debug('Check API-Key');
  logger.debug(`API-Key: ${process.env.apikey}`);
  logger.debug(`Auth-Header: ${req.headers.authorization}`);
  if (process.env.apikey !== req.headers.authorization) throw createError(401, 'Authentication failed');
};

const startReviewApp = async (req, res) => {
  const body = await json(req);
  logger.info(`Start Review App: ${body.image} => ${body.host}`);
  try {
    logger.info('Rename old Container');
    await docker.post(`http:/containers/${body.host}/rename?name=${body.host}-old`);
  } catch (error) {
    logger.warn(error.response.data.message);
  }
  logger.info('Pull Image...');
  await docker.post(`http:/images/create?fromImage=${body.image}`);
  logger.info('Create Container...');
  const Labels = {
    ...defaultLabels,
    ...body.additionalLabels,
  };
  Labels[`traefik.http.routers.${body.host.replace('.', '-')}.rule`] = `Host(\`${body.host}\`)`;

  const { data } = await docker.post(`http:/containers/create?name=${body.host}`, {
    Hostname: body.host,
    Image: body.image,
    Labels,
    NetworkMode: process.env.traefik_network,
  });
  logger.debug(JSON.stringify(data));
  logger.info(`Container created: ${data.Id}`);
  logger.info('Start Container...');
  await docker.post(`http:/containers/${data.Id}/start`);
  logger.info('Container started');
  logger.info('Remove old Container...');
  try {
    await docker.delete(`http:/containers/${body.host}-old?force=true`);
  } catch (error) {
    if (error.response.status === 404) logger.warn(error.response.data.message);
    else throw error;
  }
  logger.info('Old Container removed');
  res.end(`Review-App is running: ${body.host}`);
};
const stopReviewApp = async (req, res) => {
  const body = await json(req);
  logger.info(`Stop Review App: ${body.host}`);
  logger.info('Remove Container...');
  try {
    await docker.delete(`http:/containers/${body.host}?force=true`);
    logger.info('Container removed');
    res.end(`Review-App is stopped: ${body.host}`);
  } catch (error) {
    if (error.response.status === 404) {
      logger.info(`Review-App ${body.host} not found.`);
      res.end(`Review-App ${body.host} not found.`);
    } else throw error;
  }
};

module.exports = handleErrors(async (req, res) => {
  logger.info(`New Request: ${req.url}`);
  checkApiKey(req);

  switch (req.url) {
    case '/start':
      await startReviewApp(req, res);
      break;
    case '/stop':
      await stopReviewApp(req, res);
      break;
    default:
      throw createError(404, 'Not found');
  }
});
