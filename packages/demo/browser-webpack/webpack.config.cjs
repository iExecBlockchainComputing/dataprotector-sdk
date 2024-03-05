const webpack = require('webpack');

module.exports = {
  // ...
  resolve: {
    fallback: {
      'crypto': require.resolve('crypto-browserify'),
      "stream": require.resolve("stream-browserify"),
    },
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/node:crypto/, function(resource) {
      resource.request = resource.request.replace(/^node:/, '');
    })
  ]
};