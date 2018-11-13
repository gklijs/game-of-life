const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TSLintPlugin = require('tslint-webpack-plugin');
const PrettierPlugin = require("prettier-webpack-plugin");

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
    new CopyWebpackPlugin(['src/index.html']),
    new TSLintPlugin({files: ['src/ts/**/*.ts', 'src/js/**/*.js']}),
    new PrettierPlugin()
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
