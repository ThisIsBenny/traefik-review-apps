const axios = require('axios');

const requiredEnvs = ['plugins_webhook_urls'];

const failure = async ({ message: errorMessage }, { hostname, image = null, action }) => {
  global.logger.debug(`webhook Plugin: ${action} => ${errorMessage}`);
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action,
      status: 'failed',
      hostname,
      image,
      errorMessage,
    });
  });
};
const preDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute webhook plugin (preDeployment)');
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action: 'deploymennt',
      status: 'started',
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
      status: 'success',
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
      status: 'started',
      hostname,
    });
  });
};
const postTeardown = async ({ hostname }) => {
  global.logger.info('Execute webhook plugin (postTeardown)');
  process.env.plugins_webhook_urls.split(',').forEach(async (url) => {
    await axios.post(String(url).trim(), {
      action: 'teardown',
      status: 'success',
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
