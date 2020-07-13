const failure = (error) => {
  global.logger.debug(`Dummy Plugin: Error => ${error}`);
};
const predeployment = ({ hostname, image }) => {
  global.logger.info('Execute dummy plugin (predeployment)');
  global.logger.debug(`Dummy-Pluign - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Pluign - Image: ${image}`);
};
const postdeployment = ({ hostname, image }) => {
  global.logger.info('Execute dummy plugin (postdeployment)');
  global.logger.debug(`Dummy-Pluign - Hostname: ${hostname}`);
  global.logger.debug(`Dummy-Pluign - Image: ${image}`);
};

module.exports = {
  failure,
  predeployment,
  postdeployment,
};
