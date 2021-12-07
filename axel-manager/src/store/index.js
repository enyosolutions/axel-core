import Vue from 'vue';
import Vuex from 'vuex';
import { startCase } from 'lodash';
import config from '@/config';
// import * as models from '../models';

// import 'es6-promise/auto';
import modules from './modules';

const modelDefaultOptions = {
  mode: 'remote',
  url: null,
  columns: null,
  viewPath: null,
  stats: false,
  nestedDisplayMode: 'list', // list | object
  detailPageMode: 'page'
};

const modelDefaultActions = {
  noActions: false,
  create: true,
  edit: true,
  filter: true,
  dateFilter: false,
  view: true,
  delete: true,
  import: false,
  export: false,
};


Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    currentLocale: localStorage.getItem(`${config.appKey}_locale`) || config.defaultLocale,
    token: null,
    models: []
  },
  mutations: {
    models(state, appModels) {
      state.models = appModels;
    },
    auth(state, auth) {
      state.token = auth;
    },
    currentLocale(state, locale) {
      state.locale = locale;
      localStorage.setItem(`${config.appKey}_locale`, locale);
    },
  },
  actions: {
    changeLocale(context, locale) {
      context.commit('currentLocale', locale);
    },
    getAuth({ commit }) {
      const promise = this._vm.$socket.post('/axel-manager/auth');
      return promise
        .then(res => {
          commit('auth', res.body);
          if (this._vm && this._vm.$http) {
            this._vm.$http.defaults.headers.common.Authorization = `Bearer ${res.body}`;
            this._vm.$http.defaults.headers.Authorization = `Bearer ${res.body}`;
          }
        })
        .catch(err => {
          console.error('getModels', err);
        });
    },
    getModels({ commit }) {
      const promise = this._vm.$socket.get('/axel-manager/admin-models');
      return promise
        .then(res => {
          const apiModels = res.body.map(model => {
            model.title = model.title || startCase(model.name);
            model = {
              ...model,
              options: {
                ...modelDefaultOptions,
                ...model.options,
              },
              actions: {
                ...modelDefaultActions,
                ...model.actions,
              },
              nestedDisplayMode: model.nestedDisplayMode || 'object',
            };
            return model;
          });
          commit('models', apiModels);
        })
        .catch(err => {
          console.error('getModels', err);
        });
    },
    refreshListOfValues(context) {
      const { dispatch } = context;
      dispatch('getModels');
      dispatch('member/getItems');
      return true;
    },
  },
  modules,
});
