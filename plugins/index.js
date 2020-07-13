const failurePlugins = [];
const predeploymentPlugins = [];
const postdeploymentPlugins = [];

const bootstrap = () => {
  global.logger.info('Plugins will be registered');
  process.env.plugins.split(',').forEach((e) => {
    try {
      global.logger.info(`Register ${e} plugin`);
      const plugin = require(`./${e}.plugin`); // eslint-disable-line security/detect-non-literal-require, global-require, import/no-dynamic-require
      if (typeof plugin.failure === 'function') {
        global.logger.debug(`Register failure function for ${e.trim()} plugin`);
        failurePlugins.push(plugin.failure);
      }
      if (typeof plugin.predeployment === 'function') {
        global.logger.debug(`Register predeployment function for ${e.trim()} plugin`);
        predeploymentPlugins.push(plugin.predeployment);
      }
      if (typeof plugin.postdeployment === 'function') {
        global.logger.debug(`Register postdeployment function for ${e.trim()} plugin`);
        postdeploymentPlugins.push(plugin.postdeployment);
      }
    } catch (error) {
      global.logger.warn(`${e} Plugin can't be registered`);
      global.logger.error(error);
    }
  });
};

const failure = (error) => {
  try {
    failurePlugins.forEach((p) => {
      p(error);
    });
  } catch (e) {
    global.logger.error(e);
  }
};
const pre = (reqBody) => {
  try {
    predeploymentPlugins.forEach((p) => {
      p(reqBody);
    });
  } catch (e) {
    global.logger.error(e);
  }
};
const post = (reqBody) => {
  try {
    postdeploymentPlugins.forEach((p) => {
      p(reqBody);
    });
  } catch (e) {
    global.logger.error(e);
  }
};

module.exports = {
  bootstrap,
  failure,
  pre,
  post,
};
