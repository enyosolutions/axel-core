/* eslint-disable no-underscore-dangle */
import dayjs from 'dayjs';
import _ from 'lodash';
import VueAwesomeComponents from 'vue-aw-components/src/plugin';
import { FormGenerator } from 'vue-aw-components';

import Socket from '../services/Socket';
import FieldLayoutEditor from '../components/fields/FieldLayoutEditor.vue';
import FieldBooleanExpressionEditor from '../components/fields/FieldBooleanExpressionEditor.vue';
// import FieldTinyMce from './components/fields/FieldTinyMce.vue';

/**
 * You can register global components here and use them as a plugin in your main Vue instance
 */

const GlobalComponents = {
  install(Vue) {
    // Vue.component('fieldTinyMce', FieldTinyMce);
    Vue.component('fieldLayoutEditor', FieldLayoutEditor);
    Vue.component('fieldBooleanExpressionEditor', FieldBooleanExpressionEditor);
    Vue.filter('formatDate', (date, format = 'DD.MM.YYYY à h:mm') => {
      if (!date) return '';
      return dayjs(date).format(format);
    });

    Vue.use(Socket);
    if (!Vue.prototype.$notify) {
      Vue.prototype.$notify = Vue.prototype.$awNotify;
    }
    Vue.use(FormGenerator, {
      fields: _.values(FormGenerator.fieldsLoader),
    });

    Vue.use(VueAwesomeComponents, {
      config: {
        modelsStorePath: 'models',
        rolesStorePath: 'user.user.roles',
        extendedRolesStorePath: 'user.extendedRoles',
        primaryKey: 'id',
      },
      AwesomeCrud: {
        props: {
          primaryKey: { type: String, default: 'id' },
          modelsStorePath: {
            type: String,
            default: 'models'
          },
          options: { detailPageMode: 'sidebar' }
        }
      },
      AwesomeTable: {
        props: {
          primaryKey: {
            type: String,
            default: 'id',
          },
          modelsStorePath: {
            type: String,
            default: 'models'
          }
        }
      },
      AwesomeList: {
        props: {
          primaryKey: {
            type: String,
            default: 'id',
          },
          modelsStorePath: {
            type: String,
            default: 'models'
          }
        }
      },
      AwesomeForm: {
        props: {
          primaryKey: {
            type: String,
            default: 'id'
          },
          modelsStorePath: {
            type: String,
            default: 'models'
          }
        },

      },
      //  $awApi: Vue.prototype.$socket
    });
  },
};

export default GlobalComponents;
