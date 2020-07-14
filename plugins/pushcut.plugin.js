const axios = require('axios');

const requiredEnvs = ['plugins_pushcut_url'];

const failure = async ({ message }, { hostname, image, action }) => {
  global.logger.debug(`PushCut Plugin: ${action} => ${message}`);
  let title = '';
  let text = '';
  switch (action) {
    case 'deployment':
      title = '‼️ Deployment failed';
      text = `Deployment of the Image '${image}' to '${hostname}' is failed: ${message}.`;
      break;
    case 'teardown':
      title = '‼️ Teardown failed';
      text = `Teardown of '${hostname}' is failed: ${message}.`;
      break;
    default:
      break;
  }
  await axios.post(process.env.plugins_pushcut_url, {
    title,
    text,
  });
};
const preDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (preDeployment)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🏗 Start Deployment',
    text: `The Deployment of the Image '${image}' to '${hostname}' is started.`,
  });
};
const postDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (postDeployment)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🚚 Deployment done',
    text: `The Deployment of the Image '${image}' to '${hostname}' is done.`,
    input: `http://${hostname}`,
  });
};
const preTeardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (preTeardown)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🏗 Start Teardown',
    text: `The Teardown of '${hostname}' is started.`,
  });
};
const postTeardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (postTeardown)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🚧 Teardown done',
    text: `The Teardown of '${hostname}' is done.`,
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
