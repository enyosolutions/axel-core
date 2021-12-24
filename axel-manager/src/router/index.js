import Vue from 'vue';
import Router from 'vue-router';
import qs from 'qs';

import Dashboard from '@/pages/Dashboard.vue';
import CrudWrapper from '@/pages/CrudWrapper.vue';
import ModelEditor from '@/pages/ModelEditor.vue';
import NotFound from '@/pages/NotFound.vue';
import Body from '../components/layout/Body.vue';

const authGuard = (to, from, next) => {
  /*
    if (store.state.user.token) {
      return next();
    }
    console.warn('Authgard:: Blocked : ', to.path, store.state.user);
    next('/login');
    */
  next();
};

// const organisationGard = (to, from, next) => {
//   if (store.state.user && store.state.user.organisationId && store.state.organisation) {
//     return next();
//   }
//   console.warn('Authgard:: Blocked : ', to.path, store.state.user);
//   next('/onboarding');
// };
Vue.use(Router);

const routes = [
  { path: '', redirect: { name: 'Dashboard' } },
  {
    path: '/app',
    component: Body,
    beforeEnter: authGuard,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        beforeEnter: authGuard,
        meta: {
          title: 'Default Dashboard | axel',
        }
      },
      {
        path: '404',
        name: 'NotFound',
        component: NotFound,
        meta: {
          title: 'NotFOund | axel',
        }
      },
      {
        path: 'configurator/:identity',
        name: 'ModelEditor',
        component: ModelEditor,
        beforeEnter: authGuard,
        meta: {
          title: 'Default Dashboard | axel',
        },
        props: () => ({
        }),
        children: [
          {
            name: `CrudWrapper-view`,
            path: ':id',
            component: CrudWrapper,
            meta: {
            },
            props: {
            },
          },
          {
            name: `CrudWrapper-edit`,
            path: ':id/edit',
            component: CrudWrapper,
            meta: {
            },
            props: {
              nestedDisplayMode: 'object',
            },
          },
        ],
      },
      {
        path: 'models/:identity',
        name: 'CrudWrapper',
        component: CrudWrapper,
        beforeEnter: authGuard,
        meta: {
          title: 'Default Dashboard | axel',
        },
        props: () => ({
        }),
        children: [
          {
            name: `CrudWrapper-view`,
            path: ':id',
            component: CrudWrapper,
            meta: {
            },
            props: {
            },
          },
          {
            name: `CrudWrapper-edit`,
            path: ':id/edit',
            component: CrudWrapper,
            meta: {
            },
            props: {
              nestedDisplayMode: 'object',
            },
          },
        ],
      },

    ]
  },
  {
    path: '*',
    redirect: { name: 'NotFound' }
  },
];

const router = new Router({
  routes,
  base: '/axel-manager',
  //mode: 'history',
  linkActiveClass: 'active',
  parseQuery(query) {
    return qs.parse(query);
  },
  stringifyQuery(query) {
    const result = qs.stringify(query);
    return result ? `?${result}` : '';
  },
  scrollBehavior() {
    return { x: 0, y: 0 };
  }
});

export default router;
