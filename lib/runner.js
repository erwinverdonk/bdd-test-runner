const WebdriverIO = require('webdriverio');
const os = require('os');
const Allure = require('./allure');
const fs = require('fs-extra');
const uuid = require('uuid/v4');

const EXEC_PATH = process.cwd();
const CONFIG_TMP_PATH = `${os.tmpdir()}/wdio.conf.js`;

const run = async (profile, capability, params) => {
  capability.project = profile.name;
  capability.build = params.build ? params.build.toString() : `unkown-${uuid()}`;

  const uniqueConfigPath = CONFIG_TMP_PATH.replace(/(\.js)$/, `.${uuid()}$1`);

  // Create browser signature
  const browserSignature = [
    capability.platform || 'any',
    capability.browserName.replace(/ {1,}?/, '_'),
    capability.version || 'any'
  ].join('_');

  // Adjust the WDIO configuration for this specific run
  const runConfig = Object.assign(profile.wdioConfig, {
    capabilities: [capability]
  });

  // Add framework options to WDIO configuration
  Object.keys(profile.frameworkOptions).reduce(
    (acc, key) => !(acc[`${key}Opts`] = profile.frameworkOptions[key]) || acc,
    runConfig
  );

  // Add miscellaneous options to WDIO configuration
  ['specs', 'framework', 'reporters', 'reporterOptions'].reduce(
    (acc, key) => !(acc[key] = profile[key]) || acc,
    runConfig
  )

  // Add selenium options to WDIO configuration
  Object.keys(profile.selenium).reduce(
    (acc, key) => !(acc[key] = profile.selenium[key]) || acc,
    runConfig
  );

  // Make sure the run only executes provided specs
  runConfig.specs = params.feature
    ? runConfig.specs.map(_ => _.replace(/\*(?=\.feature)/, params.feature))
    : runConfig.specs

  // Initialize Allure
  const allure = Allure.init(
    `${EXEC_PATH}/${profile.reporterOptions.outputDir}/${browserSignature}`,
    capability.build
  );

  // Set Allure reporting options
  runConfig.reporters.splice(0, 0, 'allure');
  runConfig.reporterOptions.allure.outputDir = allure.getPaths().result;

  // Set Allure environment variables
  allure.setEnvVars({
    platform: capability.platform || 'any',
    browser: `${capability.browserName} ${capability.version || 'any'}`,
    framework: runConfig.framework,
  });

  // Write the injected temporary configuration file to the system so we can
  // use it for our test run.
  fs.writeFileSync(
    uniqueConfigPath,
    `exports.config = ${JSON.stringify(runConfig)}`
  );

  // Run the tests
  const exitCode = await new WebdriverIO.Launcher(
    uniqueConfigPath,
    params
  ).run()

  // Generate Allure report
  allure.generateReport();

  // Delete temporary run files
  fs.unlinkSync(uniqueConfigPath);

  return {
    browserSignature,
    exitCode
  };
}

module.exports = {
  run
}
