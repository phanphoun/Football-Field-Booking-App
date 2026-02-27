const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "url": require.resolve("url"),
    "assert": require.resolve("assert"),
    "http": false,
    "https": false,
    "os": false,
    "zlib": false
  };

  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  // Fix for axios and other packages that expect process
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    }
  });

  return config;
};
