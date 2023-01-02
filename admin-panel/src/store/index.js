import Vue from 'vue';
import Vuex from 'vuex';
import { startCase, get, merge } from 'lodash';
import config from '@/config';
import * as models from '@/models';
// import * as models from '../models';

// import 'es6-promise/auto';
import * as modules from './modules';
import { editLayout, editFields, writeConfigToFs } from '../models/actions';

const modelDefaultOptions = {
  mode: 'remote',
  url: null,
  columns: null,
  viewPath: null,
  stats: false,
  nestedDisplayMode: 'list', // list | object
  detailPageMode: 'page',
};

const modelDefaultActions = {
  noActions: false,
  create: true,
  edit: true,
  filter: true,
  dateFilter: false,
  view: true,
  delete: true,
  changeDisplayMode: true,
  import: false,
  export: false,
  columns: true,
};

Vue.use(Vuex);
const primaryColor = localStorage.getItem(`${config.appKey}_primaryColor`);
const secondaryColor = localStorage.getItem(`${config.appKey}_secondaryColor`);

if (primaryColor) {
  document.documentElement.style.setProperty('--primary', primaryColor);
}
if (secondaryColor) {
  document.documentElement.style.setProperty('--secondary', secondaryColor);
}

const appConfig = localStorage.getItem(`${config.appKey}_appCOnfig`);

export default new Vuex.Store({
  state: {
    currentLocale:
      localStorage.getItem(`${config.appKey}_locale`) || config.defaultLocale,
    token: localStorage.getItem(`${config.appKey}_token`),
    models: [],
    primaryColor,
    secondaryColor,
    appConfig,
    appEnv: 'production',
    currentUser: {},
    roles: [],
  },
  getters: {
    isProduction(state) {
      return state.appConfig && state.appConfig.NODE_ENV === 'production';
    },
    useApiEndpoints(state) {
      return (
        state.appConfig
        && state.appConfig.adminConfig
        && state.appConfig.adminConfig.useApiEndpoints
      );
    },
    /**
     * Models that can be seen in the menu
     *
     * @returns
     */
    viewableModels(state) {
      return state.models
        ? state.models.filter(
          (m) =>
            m.menuIsVisible
            && (m.identity === 'axelModel' || !m.identity.startsWith('axel'))
        )
        : [];
    },
  },
  mutations: {
    models(state, appModels) {
      state.models = appModels;
    },
    auth(state, auth) {
      if (auth) {
        state.token = auth;
      }
    },
    token(state, auth) {
      if (auth) {
        state.token = auth;
        this._vm.$http.defaults.headers.common.Authorization = `Bearer ${auth}`;
        this._vm.$http.defaults.headers.Authorization = `Bearer ${auth}`;
        this._vm.$awApi.defaults.headers.common.Authorization = `Bearer ${auth}`;
        this._vm.$awApi.defaults.headers.Authorization = `Bearer ${auth}`;
        localStorage.setItem(`${config.appKey}_token`, auth);
      }
    },
    currentUser(state, currentUser) {
      state.currentUser = currentUser;
    },
    roles(state, roles) {
      state.roles = roles;
    },
    currentLocale(state, locale) {
      state.locale = locale;
      localStorage.setItem(`${config.appKey}_locale`, locale);
    },
    appEnv(state, appEnv) {
      state.appEnv = appEnv;
    },

    appConfig(state, appConf) {
      state.appConfig = appConf;
    },

    // eslint-disable-next-line no-shadow
    colors(state, { primaryColor, secondaryColor }) {
      if (primaryColor) {
        localStorage.setItem(`${config.appKey}_primaryColor`, primaryColor);
        state.primaryColor = primaryColor;
        localStorage.setItem(`${config.appKey}_secondaryColor`, secondaryColor);
        state.secondaryColor = secondaryColor;

        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty(
          '--secondary',
          secondaryColor
        );
      }
    },
  },
  actions: {
    changeLocale(context, locale) {
      context.commit('currentLocale', locale);
    },
    getAuth({ commit, state }) {
      const promise = this._vm.$socket.post('/admin-panel/auth', {
        token: state.token,
      });
      return promise.catch((err) => {
        console.error('getAuth', err);
      });
    },

    refreshWsUser({ commit, dispatch, state }) {
      const q = this._vm.$socket.get('/axel-admin/auth/user', {
        headers: { authorization: state.token },
      });
      return q
        .then((res) => {
          const { user } = res;
          if (user) {
            commit('currentUser', user);
            dispatch('getModels');
          }
        })
        .catch((err) => {
          console.warn('[USER STORE] user refresh error', err);
          this._vm.$awEventBus.$emit('api-network-error');

          if (this._vm.$awNotify) {
            this._vm.$awNotify({
              title: err.response ? err.response : err,
              type: 'warning',
            });
          }
          if (err.response) {
            switch (err.response.status) {
            case 404:
            case 401:
            case 500:
              dispatch('logout');
              break;
            default:
              break;
            }
          }
          throw err;
        });
    },
    refreshUser({ commit, dispatch, state }) {
      if (!state.token || state.token === 'null') {
        throw new Error('missing_token');
      }
      const q = this._vm.$http.get('/api/axel-admin/auth/user', {
      });
      return q
        .then((res) => {
          // eslint-disable-next-line
          const { user } = res;
          // commit('roles', appRoles);
          commit('currentUser', user);
          return user;
        })
        .catch((err) => {
          console.warn('[USER STORE] user refresh error', err);
          this._vm.$awEventBus.$emit('api-network-error');

          if (this._vm.$awNotify) {
            this._vm.$awNotify({
              title: err.response ? err.response : err,
              type: 'warning',
            });
          }
          if (err.response) {
            switch (err.response.status) {
            case 404:
            case 401:
              dispatch('logout');
              break;
            default:
              break;
            }
          }
          throw err;
        });
    },
    getModels({ commit, state }) {
      const promise = this._vm.$socket.get('/admin-panel/admin-models');
      return promise
        .then((res) => {
          const apiModels = res.body.map((model) => {
            model.title = model.title || startCase(model.name);
            const frontModel = models
              ? Object.values(models).find((m) => m.identity === model.identity)
              : {};
            model = merge(model, frontModel);
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
            model.customTopRightActions = [
              writeConfigToFs,
              editLayout,
              editFields,
            ];
            if (
              !(
                state.appConfig
                && state.appConfig.adminConfig
                && state.appConfig.adminConfig.useNestedModels
              )
            ) {
              delete model.nestedModels;
            }
            if (
              !(
                state.appConfig
                && state.appConfig.adminConfig
                && state.appConfig.adminConfig.useApiEndpoints
              )
            ) {
              delete model.url;
            }
            return model;
          });
          commit('models', apiModels);
        })
        .catch((err) => {
          console.error('getModels', err);
        });
    },
    getConfig({ commit, state }) {
      const promise = this._vm.$socket.get('/admin-panel/config');
      return promise
        .then((res) => {
          // commit('models', apiModels);
          state.appConfig = res.body;
          commit('colors', {
            primaryColor: get(res, 'body.framework.primaryColor'),
            secondaryColor: get(res, 'body.framework.secondaryColor'),
          });
        })
        .catch((err) => {
          console.error('getConfig', err);
        });
    },

    async getEnv({ commit, state }) {
      const { data } = await this._vm.$awApi.get('/api/axel-admin/status');
      commit('appEnv', data.env);
      if (
        data.framework
        && data.framework.primaryColor
        && data.framework.secondaryColor
      ) {
        commit('colors', data.framework);
        commit('appConfig', data);
      }
    },

    refreshListOfValues(context) {
      const { dispatch } = context;
      dispatch('getModels');
      return true;
    },
    logout(context) {
      const { commit } = context;
      commit('token', null);
      commit('auth', null);
      commit('currentUser', null);
      return true;
    },
  },
  modules,
});
