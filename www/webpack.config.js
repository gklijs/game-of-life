const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
    entry: "./src/bootstrap.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bootstrap.js",
    },
    devtool: "source-map",
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    mode: "development",
    plugins: [
        new CopyWebpackPlugin(['index.html'])
    ],
    module: {
        rules: [
            {test: /\.js$/, loader: "source-map-loader", enforce: "pre"},
            {test: /\.tsx?$/, loader: "awesome-typescript-loader"}
        ]
    },
};