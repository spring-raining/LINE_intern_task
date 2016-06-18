'use strict';

import 'babel-polyfill';
import path from 'path';
import webpack from 'webpack';

export default {
  entry: {
    index: './cli/index.jsx',
    supervise: './cli/supervise.jsx',
  },
  output: {
    publicPath: '/',
    path: path.join(__dirname, 'dist/js'),
    filename: '[name].bundle.js',
  },
  target: 'web',
  resolve: {
    extensions: ['', '.js', '.jsx'],
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel' },
    ],
  },
};

