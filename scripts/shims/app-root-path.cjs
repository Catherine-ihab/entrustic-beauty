/**
 * Stand-in for the `app-root-path` package.
 *
 * TypeORM requires it lazily for CLI/GUI helpers. The real module walks up from
 * `module.parent`, which does not exist inside an esbuild bundle, so it threw
 * `TypeError: The "path" argument must be of type string` on load.
 *
 * Nothing in the running API depends on the reported path, so a functional
 * replacement keyed off the working directory is sufficient.
 */
const path = require('path');

const appRootPath = process.cwd();

module.exports = {
  path: appRootPath,
  resolve: (pathToModule) => path.join(appRootPath, pathToModule),
  require: (pathToModule) => require(path.join(appRootPath, pathToModule)),
  setPath: () => {
    throw new Error('app-root-path shim: setPath() is not supported.');
  },
  toString: () => appRootPath,
};
