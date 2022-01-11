
/**
 */
module.exports.security = {
  secureAllEndpoints: true, // if true then all endpoints must pass the security middleware
  securityPolicy: 'isAuthorized', // policy to use for securing the endpoints
  // goes directly into the cors middleware config
  cors: {
    credentials: true,
    /*
     **************************************************************************
     *                                                                          *
     * Allow CORS on all routes by default? If not, you must enable CORS on a   *
     * per-route basis by either adding a "cors" configuration object to the    *
     * route config, or setting "cors:true" in the route config to use the      *
     * default settings below.                                                  *
     *                                                                          *
     **************************************************************************
     */
    origin: [
      'http://localhost:1337',
      'http://localhost:1338',
      'http://localhost:1905',
      'http://localhost:3000',
      'http://localhost:3333',
      'http://localhost:3474',
      'http://localhost:4444',
      'http://localhost:5000',
      'http://localhost:8000',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8888',
      /\.enyosolutions\.com/
    ],

    /*
     **************************************************************************
     *                                                                          *
     * Which methods should be allowed for CORS requests? This is only used in  *
     * response to preflight requests (see article linked above for more info)  *
     *                                                                          *
     **************************************************************************
     */

    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD',

    /*
     **************************************************************************
     *                                                                          *
     * Which headers should be allowed for CORS requests? This is only used in  *
     * response to preflight requests.                                          *
     *                                                                          *
     **************************************************************************
     */

    allowedHeaders: 'Authorization, Content-Type, Cache-Control, Origin, X-Requested-With, Accept, Access-Control-Allow-Credentials',
  },
};
