// const express = require('express');
/*
type RouteObject = {
  routes : {
    [key: string]: RouteDefinitions;
  };
};
*/

module.exports = {
  routes: {
    // '/': {
    //   controller: 'core/App',
    //   action: 'app',
    //   secure: false, // you need this if you defined you api as always secure !
    //   skipAssets: true,
    // },


    '/': {
      controller: 'core/AppController',
      action: 'index',
      secure: false
    },

    '/^(login|register|forgot-password|password-reset|app|reset-password)$': {
      controller: 'core/App',
      action: 'app',
      skipAssets: true,
      secure: false,
    },

    '/app.*': {
      controller: 'core/App',
      action: 'app',
      skipAssets: true,
      secure: false,
    },

    '/reset-password/:id': {
      controller: 'core/App',
      action: 'app',
      skipAssets: true,
      secure: false,
    },

    '/api/swagger.json': {
      controller: 'core/AppController',
      action: 'swaggerJson',
      secure: false,
    },

    '/api/swagger.yml': {
      controller: 'core/AppController',
      action: 'swaggerYml',
      secure: false,
    },

    '/console': {
      view: 'swagger',
      secure: false,
    },

    '/documentation': {
      view: 'redoc',
      secure: false,
    },

    'OPTIONS /api/*': {
      controller: 'core/AppController',
      action: 'ok',
      secure: false,
    },

    '/api/status': {
      controller: 'core/AppController',
      action: 'status',
      secure: false,
    },

    'GET /api/statistics/overview': 'core/AppController.statistics',

    'POST /api/auth/register': {
      controller: 'core/UserController',
      action: 'create',
      secure: false,
    },
    'POST /api/auth/login': {
      controller: '@axel/controllers/AuthController',
      action: 'login',
      secure: false,
    },

    'POST /api/auth/admin_login': {
      controller: 'core/AuthController',
      action: 'login',
      secure: false,
    },

    'POST /api/auth/google/callback': {
      controller: 'core/AuthController',
      action: 'googleCallback',
      secure: false,
    },

    'POST /api/auth/facebook/callback': {
      controller: 'core/AuthController',
      action: 'facebookCallback',
      secure: false,
    },

    'POST /api/auth/forgot': {
      controller: 'core/AuthController',
      action: 'forgot',
      secure: false,
    },
    'GET /api/auth/user': 'core/AuthController.get',

    'GET /api/auth/confirm/:email': {
      controller: 'core/AuthController',
      action: 'confirmUserRegistration',
      secure: false,
    },

    'GET /api/user/token/:resetToken': 'core/UserController.getByResetToken',
    'POST /api/user/reset/:resetToken': {
      controller: 'core/UserController',
      action: 'reset',
      secure: false,
    },
    'GET /api/user/exists': 'core/UserController.exists',
    'POST /api/user': {
      controller: 'core/UserController',
      action: 'create',
      secure: false,
    },
    'GET /api/user': 'core/UserController.list',
    'GET /api/user/:userId': {
      controller: 'core/UserController',
      action: 'get',
      secure: true,
    },
    'PUT /api/user/:userId': 'core/UserController.update',
    'POST /api/user/:userId/avatar': 'core/UserController.uploadAvatar',
    'DELETE /api/user/:userId': 'core/UserController.delete',

    'GET /api/auth/gmail': {
      controller: 'core/AuthController',
      action: 'gmailAuth',
      secure: false,
    },
  },
};
