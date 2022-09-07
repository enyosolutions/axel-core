const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

const API_URL = process.env.API_URL || 'http://localhost:1335';
// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  indexPath: process.env.NODE_ENV === 'production' ? 'admin-panel.html' : 'index.html',
  pluginOptions: {},
  lintOnSave: true,
  filenameHashing: false,
  css: {
    extract: false
  },
  configureWebpack: {
    optimization: {
      splitChunks: false
    },
    resolve: {
      alias: {
        '@/*': path.resolve(__dirname, 'src/*'),
        '@/': path.resolve(__dirname, 'src/'),
        '@/config': path.resolve(__dirname, 'src/config')
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        // filename: 'output.html', // the output file name that will be created
        template: 'public/index.html', // this is important - a template file to use for insertion
        inlineSource: '.(js|css)$' // embed all javascript and css inline
      }),
      new HtmlWebpackInlineSourcePlugin(HtmlWebpackPlugin)
    ]
  },
  devServer: {
    proxy: {
      '^/(api|data|socket|axel-admin-ws)': {
        target: API_URL,
        ws: true,
        changeOrigin: true
      },
    },
    host: 'localhost',
  },
};
