const eslint = require('vite-plugin-eslint');

const { createVuePlugin } = require('vite-plugin-vue2');
const { viteSingleFile } = require('vite-plugin-singlefile');

const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:5000';

module.exports = {
  define: {
    'process.env': process.env || {}
  },
  commonjsOptions: {
    transformMixedEsModules: true
  },
  plugins: [
    createVuePlugin(),

    viteSingleFile(),
  ],
  resolve: {
    alias: {
      '@/*': path.join(__dirname, 'src/*'),
      '@/': path.join(__dirname, 'src/'),
      '@/config': path.join(__dirname, 'src/config')
    },
  },

  server: {
    proxy: {
      '^/(api|data|socket|axel-admin-ws)': {
        target: API_URL,
        ws: false,
        changeOrigin: true
      },
      '^/(socket|axel-admin-ws)': {
        target: API_URL,
        ws: true,
        changeOrigin: true
      },
    },
    host: 'localhost',
  },
};
