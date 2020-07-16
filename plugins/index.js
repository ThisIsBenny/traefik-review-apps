const failurePlugins = [];
const preDeploymentPlugins = [];
const postDeploymentPlugins = [];
const preTeardownPlugins = [];
const postTeardownPlugins = [];

const bootstrap = () => {
  global.logger.info('Plugins will be registered');
  if (process.env.plugins) {
    process.env.plugins.split(',').forEach((element) => {
      const p = String(element).trim();
      try {
        global.logger.info(`Register ${p} plugin`);
        const plugin = require(`./${String(p).trim()}.plugin`); // eslint-disable-line security/detect-non-literal-require, global-require, import/no-dynamic-require

        if (plugin.requiredEnvs) {
          plugin.requiredEnvs.forEach((env) => {
            if (!process.env[String(env)]) throw new Error(`Required ENV ${env} for plugin ${p} is missing!`);
          });
        }

        if (typeof plugin.failure === 'function') {
          global.logger.debug(`Register failure function for ${p} plugin`);
          failurePlugins.push(plugin.failure);
        }
        if (typeof plugin.preDeployment === 'function') {
          global.logger.debug(`Register preDeployment function for ${p} plugin`);
          preDeploymentPlugins.push(plugin.preDeployment);
        }
        if (typeof plugin.postDeployment === 'function') {
          global.logger.debug(`Register postDeployment function for ${p} plugin`);
          postDeploymentPlugins.push(plugin.postDeployment);
        }
        if (typeof plugin.preTeardown === 'function') {
          global.logger.debug(`Register preTeardown function for ${p} plugin`);
          preTeardownPlugins.push(plugin.preTeardown);
        }
        if (typeof plugin.postTeardown === 'function') {
          global.logger.debug(`Register postTeardown function for ${p} plugin`);
          postTeardownPlugins.push(plugin.postTeardown);
        }
      } catch (error) {
        global.logger.warn(`${p} Plugin can't be registered: ${error}`);
      }
    });
  }
};

const failure = async (error, reqBody) => {
  try {
    await Promise.all(failurePlugins.map(async (p) => {
      await p(error, reqBody);
    }));
  } catch (e) {
    global.logger.error(`Plugin execution (failure) failed: ${e.message} ${e.response.data || ''}`);
  }
};
const preDeployment = async (reqBody) => {
  try {
    await Promise.all(preDeploymentPlugins.map(async (p) => {
      await p(reqBody);
    }));
  } catch (e) {
    global.logger.error(`Plugin execution (preDeployment) failed: ${e.message} ${e.response.data || ''}`);
  }
};
const postDeployment = async (reqBody) => {
  try {
    await Promise.all(postDeploymentPlugins.map(async (p) => {
      await p(reqBody);
    }));
  } catch (e) {
    global.logger.error(`Plugin execution (postDeployment) failed: ${e.message} ${e.response.data || ''}`);
  }
};
const preTeardown = async (reqBody) => {
  try {
    await Promise.all(preTeardownPlugins.map(async (p) => {
      await p(reqBody);
    }));
  } catch (e) {
    global.logger.error(`Plugin execution (preTeardown) failed: ${e.message} ${e.response.data || ''}`);
  }
};
const postTeardown = async (reqBody) => {
  try {
    await Promise.all(postTeardownPlugins.map(async (p) => {
      await p(reqBody);
    }));
  } catch (e) {
    global.logger.error(`Plugin execution (postTeardown) failed: ${e.message} ${e.response.data || ''}`);
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
