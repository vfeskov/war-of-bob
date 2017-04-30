const path = require('path');
const nodeExternals = require('webpack-node-externals');

const config = {
  target: 'node',
  entry: './index',
  context: path.resolve(__dirname),
  output: {
    filename: 'bundle.js',
    path: __dirname
  },
  module: {
    loaders: [
      {test: /\.ts$/, loader: 'awesome-typescript-loader'},
      {test: /(\.md|\.map)$/, loader: 'null-loader'},
      {test: /\.json$/, loader: 'json-loader'}
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
};

if (!process.env.PROD) {
  config.externals = [nodeExternals({
    modulesDir: path.resolve(path.join(__dirname, '..', 'node_modules'))
  })];
}

module.exports = config;
