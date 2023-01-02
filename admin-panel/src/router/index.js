import Vue from 'vue';
import Router from 'vue-router';
import qs from 'qs';

import store from '@/store/';
import Dashboard from '@/pages/Dashboard.vue';
import ApiList from '@/pages/ApiList.vue';
import CrudWrapper from '@/pages/CrudWrapper.vue';
import ModelEditor from '@/pages/ModelEditor.vue';
import NotFound from '@/pages/NotFound.vue';
import Login from '@/pages/Login.vue';
import Register from '@/pages/Register.vue';
import PasswordReset from '@/pages/PasswordReset.vue';
import Body from '../components/layout/Body.vue';

const authGuard = (to, from, next) => {
  if (store.state.token) {
    return next();
  }
  next(`/login?redirect=${to.path}`);
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
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  {
    path: '/auth/google/callback',
    name: 'Google',
    component: Login,
  },
  {
    path: '/api/auth/google/callback',
    name: 'Google api',
    component: Login,
  },
  {
    path: '/reset-password/:token',
    name: 'PasswordReset',
    component: PasswordReset,
    props: true,
  },
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
          title: 'Dashboard | axel',
        }
      },
      {
        path: 'api-list',
        name: 'Api Lists',
        component: ApiList,
        beforeEnter: authGuard,
        meta: {
          title: 'Api Lists | axel',
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
            name: 'configurator-view',
            path: ':tab',
            component: ModelEditor,
            meta: {
            },
            props: {
            },
          },
          {
            name: 'configurator-edit',
            path: 'fields/:field',
            component: ModelEditor,
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
            name: 'CrudWrapper-view',
            path: ':id',
            component: CrudWrapper,
            meta: {
            },
            props: {
            },
          },
          {
            name: 'CrudWrapper-edit',
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
  base: '/admin-panel',
  mode: 'history',
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

store.subscribeAction((action, state) => {
  if (action.type === 'logout' && router.currentRoute && ![
    '/login',
    '/register',
  ].includes(router.currentRoute.path)) {
    console.info('action event', action.type, router.currentRoute.path);
    router.push('/login');
  }
});

export default router;
