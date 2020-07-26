const failure = ({ message }, { hostname, image, action }) => {
  global.logger.info('Execute dummy plugin (failure)');
  global.logger.debug(`Dummy Plugin: Error => ${message}`);
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Plugin - Image: ${image}`);
  global.logger.debug(`Dummy-Plugin - Action: ${action}`);
};
const preDeployment = ({ hostname, image }) => {
  global.logger.info('Execute dummy plugin (preDeployment)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Plugin - Image: ${image}`);
};
const postDeployment = ({ hostname, image }) => {
  global.logger.info('Execute dummy plugin (postDeployment)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Plugin - Image: ${image}`);
};
const preTeardown = ({ hostname }) => {
  global.logger.info('Execute dummy plugin (preTeardown)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
};
const postTeardown = ({ hostname }) => {
  global.logger.info('Execute dummy plugin (postTeardown)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
};

module.exports = {
  failure,
  preDeployment,
  postDeployment,
  preTeardown,
  postTeardown,
};
