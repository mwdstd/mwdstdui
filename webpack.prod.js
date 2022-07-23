const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const WebpackVersionFilePlugin = require('webpack-version-file-plugin');

module.exports = {
  mode: 'production',
  entry: './src/app.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.(scss|css)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  optimization: {
    minimize: true
  },
  plugins: [
	 new MiniCssExtractPlugin({filename: "style.css"}),
   new MomentLocalesPlugin(),
   new WebpackVersionFilePlugin({
      packageFile: path.join(__dirname, 'package.json'),
      template: path.join(__dirname, 'version.ejs'),
      outputFile: path.join('src/', 'version.json'),
      extras: {
        'timestamp': Date.now(),
      }
    })
  ]
};