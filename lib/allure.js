const fs = require('fs-extra');
const path = require('path');
const execSync = require('child_process').execSync;

const init = (reportPath, buildNo, envVars) => {
  envVars = envVars || {};

  const getPaths = () => paths;
  const setEnvVars = (newEnvVars) => envVars = newEnvVars;
  const getEnvVars = () => envVars;
  const generateReport = paths => () => {
    fs.writeFileSync(
      `${paths.result}/environment.properties`,
      Object.keys(envVars).reduce((acc, key) => {
        return acc += `${key}=${envVars[key]}\n`;
      }, '')
    );

    // Since Allure does not have this automated yet, we need to copy
    // the previous build's history folder to the new results folder
    // before generating a new report, in order to see trends in the
    // report.
    //
    // Source: https://github.com/allure-framework/allure2/issues/682
    fs.copySync(`${paths.history}/`, `${paths.result}/history/`);
    execSync([
      'allure generate',
      `--configDirectory ${path.normalize(__dirname+'/../')}`,
      '--clean',
      `--output ${paths.report}`,
      paths.result,
    ].join(' '));
    fs.copySync(`${paths.report}/history/`, `${paths.history}/`);
  };

  const paths = {
    history: path.normalize(`${reportPath}/allure-history`),
    result: path.normalize(`${reportPath}/allure-results/${buildNo}`),
    report: path.normalize(`${reportPath}/allure-report/${buildNo}`),
  };

  fs.ensureDirSync(`${paths.result}/history`);
  fs.ensureDirSync(paths.report);
  fs.ensureDirSync(paths.history);

  return {
    getPaths,
    setEnvVars,
    getEnvVars,
    generateReport: generateReport(paths)
  };
}

module.exports = { init };
