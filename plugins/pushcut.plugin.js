const axios = require('axios');

const requiredEnvs = ['plugins_pushcut_url'];

const failure = async ({ message }, { hostname, image }) => {
  global.logger.debug(`PushCut Plugin: Error => ${message}`);
  await axios.post(process.env.plugins_pushcut_url, {
    title: '‼️ Deployment failed',
    text: `The Deployment of the Image '${image}' to '${hostname}' is failed: ${message}.`,
  });
};
const predeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (predeployment)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🏗 Start Deployment',
    text: `The Deployment of the Image '${image}' to '${hostname}' is started.`,
  });
};
const postdeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (postdeployment)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🚚 Deployment done',
    text: `The Deployment of the Image '${image}' to '${hostname}' is done.`,
    input: `http://${hostname}`,
  });
};
const preteardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (preteardown)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🏗 Start Teardown',
    text: `The Teardown of '${hostname}' is started.`,
  });
};
const postteardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (postteardown)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🚧 Teardown done',
    text: `The Teardown of '${hostname}' is done.`,
  });
};

module.exports = {
  failure,
  predeployment,
  postdeployment,
  preteardown,
  postteardown,
  requiredEnvs,
};
