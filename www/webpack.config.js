const path = require('path');
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/js/bootstrap.js",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].bundle.js',
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin(['src/index.html'])
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                loader: "source-map-loader",
                enforce: "pre",
            }
        ]
    }
};