module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
  },
  mode: 'development',
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
    },
  },
};
