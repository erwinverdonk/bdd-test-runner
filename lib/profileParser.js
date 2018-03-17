const fs = require('fs-extra');
const yaml = require('js-yaml');
const merge = require('deepmerge')
const path = require('path');
const EXEC_PATH = process.cwd();

const parse = (pathToProfile) => {
  const parsedProfilePath = path.parse(pathToProfile);

  const combineImports = (source) => {
    if(!source) return source;

    return merge(
      source.import
        ? combineImports(yaml.safeLoad(fs.readFileSync(
          `${parsedProfilePath.dir}/${source.import}`,
          'utf8'
          )))
        : {},
      source.profile,
      { arrayMerge: (dst, src) => src }
    );
  }

  return {
    profile: combineImports(yaml.safeLoad(
      fs.readFileSync(`${EXEC_PATH}/${pathToProfile}`, 'utf8')
    ))
  }
}

module.exports = {
  parse
}
