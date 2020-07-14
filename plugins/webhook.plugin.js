const axios = require('axios');

const requiredEnvs = ['plugins_webhook_urls'];

const failure = async ({message: error}, { hostname, image = null, action }) => {
  global.logger.debug(`webhook Plugin: ${action} => ${error.message}`);
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action,
      event: 'failure',
      hostname,
      image,
      error,
    });
  });
};
const preDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute webhook plugin (preDeployment)');
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action: 'deploymennt',
      event: 'preDeployment',
      image,
      hostname,
    });
  });
};
const postDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute webhook plugin (postDeployment)');
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action: 'deploymennt',
      event: 'postDeployment',
      image,
      hostname,
    });
  });
};
const preTeardown = async ({ hostname }) => {
  global.logger.info('Execute webhook plugin (preTeardown)');
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action: 'teardown',
      event: 'preTeardown',
      hostname,
    });
  });
};
const postTeardown = async ({ hostname }) => {
  global.logger.info('Execute webhook plugin (postTeardown)');
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action: 'teardown',
      event: 'postTeardown',
      hostname,
    });
  });
};

module.exports = {
  failure,
  preDeployment,
  postDeployment,
  preTeardown,
  postTeardown,
  requiredEnvs,
};
