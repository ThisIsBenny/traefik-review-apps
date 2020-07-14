const failurePlugins = [];
const preDeploymentPlugins = [];
const postDeploymentPlugins = [];
const preTeardownPlugins = [];
const postTeardownPlugins = [];

const bootstrap = () => {
  global.logger.info('Plugins will be registered');
  if (process.env.plugins) {
    process.env.plugins.split(',').forEach((e) => {
      try {
        global.logger.info(`Register ${e.trim()} plugin`);
        const plugin = require(`./${String(e).trim()}.plugin`); // eslint-disable-line security/detect-non-literal-require, global-require, import/no-dynamic-require

        if (plugin.requiredEnvs) {
          plugin.requiredEnvs.forEach((env) => {
            if (!process.env[String(env)]) throw new Error(`Required ENV ${env} for plugin ${e} is missing!`);
          });
        }

        if (typeof plugin.failure === 'function') {
          global.logger.debug(`Register failure function for ${e.trim()} plugin`);
          failurePlugins.push(plugin.failure);
        }
        if (typeof plugin.preDeployment === 'function') {
          global.logger.debug(`Register preDeployment function for ${e.trim()} plugin`);
          preDeploymentPlugins.push(plugin.preDeployment);
        }
        if (typeof plugin.postDeployment === 'function') {
          global.logger.debug(`Register postDeployment function for ${e.trim()} plugin`);
          postDeploymentPlugins.push(plugin.postDeployment);
        }
        if (typeof plugin.preTeardown === 'function') {
          global.logger.debug(`Register preTeardown function for ${e.trim()} plugin`);
          preTeardownPlugins.push(plugin.preTeardown);
        }
        if (typeof plugin.postTeardown === 'function') {
          global.logger.debug(`Register postTeardown function for ${e.trim()} plugin`);
          postTeardownPlugins.push(plugin.postTeardown);
        }
      } catch (error) {
        global.logger.warn(`${e} Plugin can't be registered: ${error}`);
      }
    });
  }
};

const failure = (error, reqBody) => {
  try {
    failurePlugins.forEach((p) => {
      p(error, reqBody);
    });
  } catch (e) {
    global.logger.error(e);
  }
};
const preDeployment = (reqBody) => {
  try {
    preDeploymentPlugins.forEach((p) => {
      p(reqBody);
    });
  } catch (e) {
    global.logger.error(e);
  }
};
const postDeployment = (reqBody) => {
  try {
    postDeploymentPlugins.forEach((p) => {
      p(reqBody);
    });
  } catch (e) {
    global.logger.error(e);
  }
};
const preTeardown = (reqBody) => {
  try {
    preTeardownPlugins.forEach((p) => {
      p(reqBody);
    });
  } catch (e) {
    global.logger.error(e);
  }
};
const postTeardown = (reqBody) => {
  try {
    postTeardownPlugins.forEach((p) => {
      p(reqBody);
    });
  } catch (e) {
    global.logger.error(e);
  }
};

module.exports = {
  bootstrap,
  failure,
  preDeployment,
  postDeployment,
  preTeardown,
  postTeardown,
};
