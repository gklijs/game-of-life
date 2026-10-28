const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: "./src/js/bootstrap.js",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].bundle.js'
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".wasm"]
  },
  plugins: [
    new CopyWebpackPlugin({patterns: ['src/index.html']}),
    new ESLintPlugin({extensions: ['ts', 'js'], files: ['src']})
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
