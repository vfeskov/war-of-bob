const path = require('path');

module.exports = {
  target: 'node',
  entry: './index',
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
