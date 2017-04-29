const path = require('path');

module.exports = {
  entry: './index',
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '..', 'public')
  },
  module: {
    loaders: [
      {test: /\.ts$/, loader: 'awesome-typescript-loader'}
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
};
