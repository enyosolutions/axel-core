export default {
  appName: 'Crm Ticketing',
  appKey: 'crm_ticketing',
  appLogo: '',
  display: {
    primaryColor: '#0077b6',
    backgroundColor: 'primary',
    backgroundImage: 'https://source.unsplash.com/random/1920x1080',
    appLogo: '',
  },
  titleLogo: '',
  env: process.env.VUE_APP_ENV || 'development', // production / test
  defaultLocale: 'fr',
  /* eslint-disable */
  apiUrl: process.env.VUE_APP_API_URL || '/',
  googleAuthClient: process.env.VUE_APP_GOOGLE_AUTH_CLIENT || '735540248134-ggfesuvs015qf6f1fqs79aufslflp29s.apps.googleusercontent.com',
  buildDate: process.env.BUILDDATE || 'now',
  version: '',
  defaultTitle: 'Cimple',

  primaryKey: 'id', // || '_id'
  features: {
    googleAuth: true,
    facebookAuth: false,
    register: true,
    passwordReset: true,
    autoWireAllModels: true,
  },
};
