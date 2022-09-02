import _ from 'lodash';
import Vue from 'vue';
import Vuex from 'vuex';
import VueI18n from 'vue-i18n';
import CripVueLoading from 'crip-vue-loading';
// import BootstrapVue from 'bootstrap-vue';
import VueGoodTablePlugin from 'vue-good-table';
import axios from 'axios';
// import VueFeather from 'vue-feather';
// import PortalVue from 'portal-vue';
import Draggable from 'vuedraggable';
// import VueTour from 'vue-tour';
// import vueKanban from 'vue-kanban';
// import VTooltip from 'v-tooltip';

// import { Integrations } from '@sentry/tracing';

// import en from 'vue-aw-components/src/translations/en.json';
import fr from 'vue-aw-components/src/translations/fr.json';
import en from 'vue-aw-components/src/translations/en.json';
// import Sentry from './services/Sentry';
import GlobalComponents from './init/globalComponents';
import router from './router';
import config from './config';
import localeFr from './locales/fr.json';
import localeEn from './locales/en.json';
import store from './store';

import './assets/scss/main.scss';

import App from './App.vue';

let vInstance;

axios.defaults.withCredentials = process.env.NODE_ENV === 'production';

Vue.prototype.$http = axios.create({
  baseURL: config.apiUrl,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(`${config.appKey}_token`)}`,
  },
});
Vue.prototype.$awApi = axios.create({
  // baseURL: '/api/axel-admin/crud/',
  baseURL: '/',
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(`${config.appKey}_token`)}`,
  },
});

Vue.prototype.$awApi.interceptors.request.use((conf) => {
  // Do something before request is sent
  if (process.env.NODE_ENV === 'development') {
    console.warn('$awApi interceptor before', conf.url);
  }
  if (conf.url.startsWith('/api/axel-admin')) {
    return conf;
  }
  const model = vInstance.$store.state.models.find(m => conf.url.startsWith(m.apiUrl));
  if (model) {
    conf.url = conf.url.replace(model.apiUrl, `/api/axel-admin/crud/${model.identity}`);
    if (process.env.NODE_ENV === 'development') {
      console.warn('$awApi interceptor after', model, conf.url);
    }
  }

  return conf;
});

Vue.use(Vuex);
Vue.use(VueI18n);
Vue.use(VueGoodTablePlugin);
Vue.use(CripVueLoading, { axios: Vue.prototype.$http });
Vue.component('Draggable', Draggable);
// Vue.use(vueKanban);
// Vue.use(VTooltip);
Vue.use(GlobalComponents);

const isProduction = process.env.NODE_ENV === 'production';

Vue.config.productionTip = isProduction;

const i18n = new VueI18n({
  locale: store.state.locale || config.defaultLocale, // set locale
  messages: _.merge({ fr, en }, {
    fr: localeFr,
    en: localeEn
  }),
  silentTranslationWarn: process.env.VUE_APP_NO_I18N_LOGS || isProduction
});

function init() {
  vInstance = new Vue({
    router,
    store,
    i18n,
    render: h => h(App),

  }).$mount('#app');
  if (!isProduction) {
    if (!window.myApp) {
      window.myApp = {};
    }
    window.myApp.vue = vInstance;
  }
}

init();
