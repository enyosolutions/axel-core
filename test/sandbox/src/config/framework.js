module.exports.framework = {
  automaticApi: true, // automatically connect database models to api enpoints those routes are overriden by any api you define
  automaticApiPrefix: '/api/automatic', // automatically connect database models to api enpoints,
  automaticApiBlacklistedModels: ['user'],
  validateDataWithJsonSchema: true,
  primaryKey: 'id', // '_id'
  primaryColor: '#0077b6',
  secondaryColor: '#fc544b',
  backgroundColor: '#fff',
  user: {
    emailConfirmationRequired: true,
    publicId: false,
    username: false,
    email: true,
    accountManualVerification: false,
  },
  roles: {
    USER: { inherits: [] }, // can access the app
    BO: { inherits: ['USER'] }, // can access the ADMIN
    ADMIN: { inherits: ['BO'] },
    SUPERADMIN: { inherits: ['ADMIN'] },
  },
  allowedRoles: ['ADMIN', 'SUPERADMIN'],
  defaultPagination: 100,
  defaultLovPagination: 1000,
  axelAdmin: {
    enabled: true,
    editableModels: false,
  },
  axelManager: true,
  defaultApiSearchMode: 'exact', // defines how search parameters will be resolved by default => exact | start || full || wildcards
  responseFormat: {
    metadata: {
      page: 0,
      perPage: 20,
      totalCount: 0,
      previous: '',
      next: '',
    },
    body: [],
  },
  errorResponseFormat: {
    errors: ['error_codes'],
    message: 'error message',
  },
};
