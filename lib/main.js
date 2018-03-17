const profileParser = require('./profileParser');
const runner = require('./runner');

const PROFILE_SCHEME = {
  reporters: [],
  reporterOptions: {
    allure: {}
  },
  capabilities: [],
  wdioConfig: {}
}

const start = async (params) => {
  if(!params.profile){
    console.log('No profile specified');
    process.exit(1);
  }

  const profile = Object.assign(
    PROFILE_SCHEME,
    profileParser.parse(params.profile).profile
  );

  const exitCodes = await Promise.all(profile.capabilities.map(
    async capability => await runner.run(
      profile,
      capability,
      params
    )
  ));

  if(exitCodes.some(_ => _.exitCode === 1)){
    console.error(exitCodes);
    process.exit(1);
  } else {
    process.exit(0);
  }
};

module.exports = { start };
