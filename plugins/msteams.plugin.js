const axios = require('axios');

const requiredEnvs = ['plugins_msteams_url'];

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
  await axios.post(process.env.plugins_msteams_url, {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
      {
        type: 'ColumnSet',
        columns: [
          {
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: `**${title}**`,
              },
              {
                type: 'TextBlock',
                text,
              },
            ],
          },
        ],
      },
    ],
  });
};
const preDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (preDeployment)');
  await axios.post(process.env.plugins_msteams_url, {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
      {
        type: 'ColumnSet',
        columns: [
          {
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: '**🏗 Start Deployment**',
              },
              {
                type: 'TextBlock',
                text: `The Deployment of the Image '${image}' to '${hostname}' is started.`,
              },
            ],
          },
        ],
      },
    ],
  });
};
const postDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute pushcut plugin (postDeployment)');
  await axios.post(process.env.plugins_msteams_url, {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
      {
        type: 'ColumnSet',
        columns: [
          {
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: '**🚚 Deployment done**',
              },
              {
                type: 'TextBlock',
                text: `The Deployment of the Image '${image}' to '${hostname}' is done.`,
              },
            ],
          },
        ],
      },
      {
        type: 'ActionSet',
        spacing: 'padding',
        actions: [
          {
            type: 'Action.OpenUrl',
            id: 'open',
            title: 'Show Deployment',
            url: `http://${hostname}`,
          },
        ],
      },
    ],
  });
};
const preTeardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (preTeardown)');
  await axios.post(process.env.plugins_msteams_url, {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
      {
        type: 'ColumnSet',
        columns: [
          {
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: '**🏗 Start Teardown**',
              },
              {
                type: 'TextBlock',
                text: `The Teardown of '${hostname}' is started.`,
              },
            ],
          },
        ],
      },
    ],
  });
};
const postTeardown = async ({ hostname }) => {
  global.logger.info('Execute pushcut plugin (postTeardown)');
  await axios.post(process.env.plugins_msteams_url, {
    title: '🚧 Teardown done',
    text: `The Teardown of '${hostname}' is done.`,
  });
  await axios.post(process.env.plugins_msteams_url, {
    $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.0',
    body: [
      {
        type: 'ColumnSet',
        columns: [
          {
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: '**🚧 Teardown done**',
              },
              {
                type: 'TextBlock',
                text: `The Teardown of '${hostname}' is done.`,
              },
            ],
          },
        ],
      },
    ],
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
