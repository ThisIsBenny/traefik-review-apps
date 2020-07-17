/* eslint-disable quote-props */
const axios = require('axios');

const requiredEnvs = ['plugins_msteams_url'];

const failure = async ({ message }, { hostname, image, action }) => {
  global.logger.debug(`msteams Plugin: ${action} => ${message}`);
  let title = '';
  let text = '';
  let facts = [];
  switch (action) {
    case 'deployment':
      title = '‼️ Deployment failed';
      text = `Deployment of the Image '${image}' to '${hostname}' is failed: ${message}.`;
      facts = [{ name: 'Hostnname:', value: hostname }, { name: 'Image:', value: image }];
      break;
    case 'teardown':
      title = '‼️ Teardown failed';
      text = `Teardown of '${hostname}' is failed: ${message}.`;
      facts = [{ name: 'Hostnname:', value: hostname }];
      break;
    default:
      break;
  }
  await axios.post(process.env.plugins_msteams_url, {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `**${title}**`,
    sections: [
      {
        activityTitle: `**${title}**`,
        facts,
        text,
      },
    ],
  });
};
const preDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute msteams plugin (preDeployment)');
  await axios.post(process.env.plugins_msteams_url, {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: '**🚀 Start Deployment**',
    sections: [
      {
        activityTitle: '**🚀 Start Deployment**',
        facts: [
          {
            name: 'Hostnname:',
            value: hostname,
          },
          {
            name: 'Image:',
            value: image,
          },
        ],
        text: `The Deployment of the Image '${image}' to '${hostname}' is started.`,
      },
    ],
  });
};
const postDeployment = async ({ hostname, image }) => {
  global.logger.info('Execute msteams plugin (postDeployment)');
  await axios.post(process.env.plugins_msteams_url, {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: '**🛰 Deployment done**',
    sections: [
      {
        activityTitle: '**🛰 Deployment done**',
        facts: [
          {
            name: 'Hostnname:',
            value: hostname,
          },
          {
            name: 'Image:',
            value: image,
          },
        ],
        text: `The Deployment of the Image '${image}' to '${hostname}' is done.`,
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'Show Deployment',
        targets: [
          {
            os: 'default',
            uri: `http://${hostname}`,
          },
        ],
      },
    ],
  });
};
const preTeardown = async ({ hostname }) => {
  global.logger.info('Execute msteams plugin (preTeardown)');
  await axios.post(process.env.plugins_msteams_url, {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: '**🏗 Start Teardown**',
    sections: [
      {
        activityTitle: '**🏗 Start Teardown**',
        facts: [
          {
            name: 'Hostnname:',
            value: hostname,
          },
        ],
        text: `The Teardown of '${hostname}' is started.`,
      },
    ],
  });
};
const postTeardown = async ({ hostname }) => {
  global.logger.info('Execute msteams plugin (postTeardown)');
  await axios.post(process.env.plugins_msteams_url, {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: '**🚧 Teardown done**',
    sections: [
      {
        activityTitle: '**🚧 Teardown done**',
        facts: [
          {
            name: 'Hostnname:',
            value: hostname,
          },
        ],
        text: `The Teardown of '${hostname}' is done.`,
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
