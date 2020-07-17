const axios = require('axios');
const os = require('os');
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
    image: process.env.plugins_pushcut_failure_image || '',
  });
};
const preDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (preDeployment)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🚀 Start Deployment',
    text: `The Deployment of the Image '${image}' to '${hostname}' is started.`,
    image: process.env.plugins_pushcut_predeployment_image || '',
  });
};
const postDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (postDeployment)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🛰 Deployment done',
    text: `The Deployment of the Image '${image}' to '${hostname}' is done.`,
    image: process.env.plugins_pushcut_postdeployment_image || '',
    actions: [
      {
        name: `Open ${hostname}`,
        url: `http://${hostname}`,
      },
      {
        name: `Stop ${hostname}`,
        url: `https://${os.hostname}/teardown`,
        urlBackgroundOptions: {
          httpMethod: 'POST',
          httpContenType: 'application/json',
          httpHeader: [
            {
              key: 'Authorization',
              value: process.env.apikey,
            },
          ],
          httpBody: JSON.stringify({
            hostname,
          }),
        },
      },
    ],
  });
};
const preTeardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (preTeardown)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🏗 Start Teardown',
    text: `The Teardown of '${hostname}' is started.`,
    image: process.env.plugins_pushcut_preteardown_image || '',
  });
};
const postTeardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (postTeardown)');
  await axios.post(process.env.plugins_pushcut_url, {
    title: '🚧 Teardown done',
    text: `The Teardown of '${hostname}' is done.`,
    image: process.env.plugins_pushcut_postteardown_image || '',
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
