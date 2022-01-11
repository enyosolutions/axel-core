module.exports = {
  swagger: {
    definition: {
      info: {
        title: '#Axel framework api doc', // Title (required)
        description: 'This is the api for using this swagger doc',
        version: '1.0.0', // Version (required)
      },
      securityDefinitions: {
        BearerAuth: {
          type: 'apiKey',
          name: 'authorization',
          in: 'header',
        },
        ApiKey: {
          type: 'apiKey',
          name: 'token',
          in: 'query',
        },
      },
      security: [{ BearerAuth: [] }],
      // host: '/api',
      basePath: '/api',
    },
    // Path to the API docs
    apis: ['./src/controllers/**/*.js', './src/api/**/*.js'],
  },
};
