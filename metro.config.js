const { getDefaultConfig } = require("expo/metro-config");
  const path = require("path");

  const projectRoot = __dirname;
  const config = getDefaultConfig(projectRoot);

  config.resolver.extraNodeModules = {
    "@workspace/api-client-react": path.resolve(projectRoot, "./lib/api-client"),
  };

  module.exports = config;
  