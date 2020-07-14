const failure = (error, { hostname, image }) => {
  global.logger.info('Execute dummy plugin (failure)');
  global.logger.debug(`Dummy Plugin: Error => ${error}`);
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Plugin - Image: ${image}`);
};
const predeployment = ({ hostname, image }) => {
  global.logger.info('Execute dummy plugin (predeployment)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Plugin - Image: ${image}`);
};
const postdeployment = ({ hostname, image }) => {
  global.logger.info('Execute dummy plugin (postdeployment)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Plugin - Image: ${image}`);
};
const preteardown = ({ hostname }) => {
  global.logger.info('Execute dummy plugin (preteardown)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
};
const postteardown = ({ hostname }) => {
  global.logger.info('Execute dummy plugin (postteardown)');
  global.logger.debug(`Dummy-Plugin - Hostname: ${hostname}`);
};

module.exports = {
  failure,
  predeployment,
  postdeployment,
  preteardown,
  postteardown,
};
