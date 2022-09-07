/* eslint-disable no-underscore-dangle, no-console */
import qs from 'qs';
// import * as io from 'socket.io-client/dist/socket.io.dev';
import { io } from 'socket.io-client';
// eslint-disable-next-line
import config from '../config';

export default {

  install(Vue) {
    console.log('socket connecting...', '/axel-admin-ws');
    const socket = io(
      config.apiUrl !== '/' ? `${config.apiUrl.replace('http', 'ws')}` : '',
      {
        path: '/axel-admin-ws',
        transports: ['websocket', 'polling'],
        transportOptions: {
          polling: {
            extraHeaders: {
              Authorization: 'Bearer abc',
            },
          },
        },
        extraHeaders: {
          Authorization: `Bearer ${localStorage.getItem(`${config.appKey}_token`)}`,
        }
      }
    );

    window.socket = socket;
    Vue.prototype.$socket = socket;

    socket._call = function apiCall(method, event, options) {
      return new Promise((resolve, reject) => {
        let eventUrl;
        let query;
        if (event.includes('?')) {
          const [url, q] = event.split('?');
          eventUrl = url;
          query = qs.parse(q);
        } else {
          eventUrl = event;
        }
        socket.emit(eventUrl, { query, ...options, method }, (err, data) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[socket callback]', method, event, err, data);
          }
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    };

    socket.get = socket._call.bind(undefined, 'GET');
    socket.post = socket._call.bind(undefined, 'POST');
    socket.put = socket._call.bind(undefined, 'PUT');
    socket.delete = socket._call.bind(undefined, 'DELETE');

    socket.onopen(() => {
      console.log('[SOCKET] connected');
    });
    socket.on('connect', () => {
      console.log('[SOCKET] connecting');
      socket.emit('Authorization', {
        token: localStorage.getItem(`${config.appKey}_token`)
      });
    });

    socket.on('disconnect', (a) => {
      console.log('[SOCKET] reconnecting...', a);
      setTimeout(() => socket.connect(), 2000);
    });

    setTimeout(() => {
      socket.connect({
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
      });
    }, 3000);
  }
};
