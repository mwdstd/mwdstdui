const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackVersionFilePlugin = require('webpack-version-file-plugin');

module.exports = {
  mode: 'development',
  entry: './src/app.ts',
  devtool: 'inline-source-map',
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
  devServer: {
    static : {
      directory : path.join(__dirname, "/")
    },
    devMiddleware:{
    	publicPath : '/dist'
    }
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: false
  },
  plugins: [
	 new MiniCssExtractPlugin({filename: "style.css"}),
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