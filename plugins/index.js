const failurePlugins = [];
const predeploymentPlugins = [];
const postdeploymentPlugins = [];

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
        if (typeof plugin.predeployment === 'function') {
          global.logger.debug(`Register predeployment function for ${e.trim()} plugin`);
          predeploymentPlugins.push(plugin.predeployment);
        }
        if (typeof plugin.postdeployment === 'function') {
          global.logger.debug(`Register postdeployment function for ${e.trim()} plugin`);
          postdeploymentPlugins.push(plugin.postdeployment);
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
