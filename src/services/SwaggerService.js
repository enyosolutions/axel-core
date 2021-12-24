const _ = require('lodash');

class SwaggerService {
  constructor() {
    this.idParameterDef = {
      name: 'id', required: true, in: 'path', type: 'string'
    };
  }

  /**
   *
   *
   * @param {Obj} swaggerDef
   * @param {Obj} list
   * @returns {void}
   * @memberof SwaggerService
   */
  generateModels(swaggerDef) {
    const { primaryKey } = axel.config.framework;
    swaggerDef.definitions = swaggerDef.definitions || {};
    _.each(axel.models, (model) => {
      const modelKey = _.capitalize(_.camelCase(model.identity));
      // create definition
      const modelDefinition = model.schema || {
        type: 'object',
        properties: this.modelParser(model._attributes), // eslint-disable-line no-underscore-dangle
      };

      // create swagger definition of the item as new
      swaggerDef.definitions[`New${modelKey}`] = {
        ...modelDefinition,
        properties: {
          ...modelDefinition.properties,
          [primaryKey]: undefined,
        },
      };

      // create the definition of the item as new + primary key
      swaggerDef.definitions[modelKey] = {
        allOf: [
          { required: [primaryKey] },
          {
            properties: {
              id: modelDefinition.properties.id,
            },
          },
          {
            $ref: `#/definitions/New${modelKey}`,
          },
        ],
      };

      // create the api response for list items (GET)
      swaggerDef.definitions[`${modelKey}_ListResponse`] = {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          count: { type: 'integer' },
          totalCount: { type: 'integer' },
          body: {
            type: 'array',
            items: {
              $ref: `#/definitions/${modelKey}`,
            },
          },
        },
      };

      // create the api response for a single item (POST, PUT, GET :id)
      swaggerDef.definitions[`${modelKey}_ItemResponse`] = {
        type: 'object',
        properties: {
          body: {
            type: 'object',
            $ref: `#/definitions/${modelKey}`,
          },
        },
      };

      this.generatePath(swaggerDef, model);
    });
  }

  /**
   *
   *
   * @param {Obj} attributes
   * @returns {Obj}
   * @memberof SwaggerService
   */
  modelParser(attributes) {
    const attrs = {};

    _.each(attributes, (val, key) => {
      attrs[key] = {
        type: _.capitalize(val.type),
      };
    });

    return attrs;
  }


  generatePath(swaggerDef, model) {
    if (model.apiUrl && !swaggerDef.paths[model.apiUrl]) {
      const url = model.apiUrl.replace(swaggerDef.basePath, '');
      const modelKey = _.capitalize(_.camelCase(model.identity));
      const tags = [_.startCase(model.identity)];
      swaggerDef.paths[url] = {
        post: {
          summary: `Create a new ${model.identity} item`,
          description: `Create a new ${model.identity} item`,
          tags,
          parameters: [
            {
              name: 'body',
              in: 'body',
              schema: { $ref: `#/definitions/New${modelKey}` },
            },
          ],
          responses: {
            200: {
              description: `List of ${model.identity} items`,
              schema: { $ref: `#/definitions/${modelKey}_ItemResponse` },
            },
          },
        },
        get: {
          summary: `List ${model.identity} items`,
          description: `List ${model.identity} items`,
          tags,
          responses: {
            200: {
              description: `List of **${model.identity}** items`,
              schema: { $ref: `#/definitions/${modelKey}_ListResponse` },
            },
          },
        },
      };
      swaggerDef.paths[`${url}/{id}`] = {
        put: {
          description: `Edit a new ${model.identity} item`,
          tags,
          parameters: [
            this.idParameterDef,
            {
              name: 'body',
              in: 'body',
              schema: { $ref: `#/definitions/${modelKey}` },
            },
          ],
          responses: {
            200: {
              description: `List of ${model.identity} items`,
              schema: { $ref: `#/definitions/${modelKey}_ItemResponse` },
            },
          },
        },
        get: {
          description: `Get an ${model.identity} item`,
          parameters: [this.idParameterDef],
          tags,
          responses: {
            200: {
              description: `List of ${model.identity} items`,
              schema: { $ref: `#/definitions/${modelKey}_ItemResponse` },
            },
          },
        },
        delete: {
          description: `Delete an ${model.identity} items`,
          parameters: [this.idParameterDef],
          tags,
          responses: {
            200: {
              description: 'successfully deleted',
            },
          },
        },
      };
    }
  }
  /*
  generate(descriptor, opts, config = null) {
    if (config) {
      this.options = config;
    }

    descriptor.paths = {};

    let matches;
    const exclude = ['csrfToken', 'csrftoken', '__getcookie'];
    // Regex to check if the route is...a regex.
    const regExRoute = /^\/([^\/]*).*$/;

    _.each(Object.keys(opts.routes), function(method) {
      _.each(opts.routes[method], function(route) {
        let path = route.path;
        if (this.options.apiPrefix && path.indexOf(this.options.apiPrefix) === 0) {
          path = path.replace(this.options.apiPrefix, '');
        }

        if (path != '/*') {
          // Perform the check
          matches = path.match(regExRoute);

          if (matches[1].length) {
            //console.log(matches[1]);
            if (exclude.indexOf(matches[1]) >= 0) {
              return;
            }

            descriptor.paths[path] = descriptor.paths[path] || {};
            descriptor.paths[path][route.method] = {
              description: path + (route.description ? ' ' + route.description : ''),
              tags: [_.capitalize(matches[1])],
            };
          }
        }
      });
    });
  }
  */

  /*
  options = {};

  setDefaultUrl(swaggerJSONUrl: string, swaggerUIPath) {
    const path: string = swaggerUIPath + '/index.html';
    const index: string = fs.readFileSync(path, 'utf-8');
    const newIndex: string = index.replace(
      'http://petstore.swagger.io/v2/swagger.json',
      swaggerJSONUrl,
    );
    fs.writeFileSync(path, newIndex, 'utf-8');
  }

  // Read from yml file
  readYml(file: string, fn: Function) {
    let m;
    const api = {};
    const resource = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
    const paths = Object.keys(resource.paths);
    _.each(paths, function(path) {
      if (this.options.apiPrefix && path.indexOf(this.options.apiPrefix) === 0) {
        path = path.replace(this.options.apiPrefix, '');
      }
      api.resourcePath = path;
      api.description = resource.description || '';
      this.descriptor.paths[path] = resource.paths[path];

      // append definitions
      if (descriptor.definitions && Object.keys(descriptor.definitions).length) {
        m = _.merge(descriptor.definitions, resource.definitions);
        descriptor.definitions = m;
      } else {
        descriptor.definitions = resource.definitions;
      }
    });

    fn();
  }


  // Generate Swagger documents
  generateDoc(opt) {
    let jsonPath;

    if (!opt) {
      throw new Error("'option' is required.");
    }

    if (!opt.basePath) {
      throw new Error("'basePath' is required.");
    }

    this.descriptor.basePath = '/' + opt.apiPrefix ? opt.apiPrefix : '';
    this.descriptor.apiVersion = opt.apiVersion ? opt.apiVersion : '1.0';
    this.descriptor.swagger = opt.swaggerVersion ? opt.swaggerVersion : '1.0';

    if (opt.info) {
      descriptor.info = opt.info;
    }

    opt.apiVersion = descriptor.apiVersion;
    opt.swagger = descriptor.swaggerVersion;

    if (!opt.fullSwaggerJSONPath) {
      jsonPath = url.parse(opt.basePath + opt.swaggerJSON).path;
      console.log(
        chalk.blue('Swagger info: '),
        chalk.gray('-----------------------------------------------'),
      );
      console.log(
        chalk.blue('basePath + swaggerJSON: '),
        chalk.yellow(opt.basePath + opt.swaggerJSON),
      );
      console.log(chalk.blue('parsed path to json file: '), chalk.yellow(jsonPath));
      if (jsonPath.lastIndexOf('//') !== -1) {
        console.log(chalk.red('verify provided options, there is an unused `//` in the json path'));
      }
      console.log(
        chalk.blue('Swagger info: '),
        chalk.gray('-----------------------------------------------'),
      );

      opt.fullSwaggerJSONPath = jsonPath;
    }

    if (opt.apis) {
      opt.apis.forEach(function(api) {
        this.readYml(api, function(err) {
          if (err) {
            throw err;
          }
        });
      });
    }
  }


  init(app, opt?) {
    let swHandler: (req, res, next) => any;
    let swaggerURL;
    let swaggerUI;

    this.options = opt || {};

    // get external assets for the UI from
    // real swagger-ui package
    app.use(options.swaggerURL, express.static(path.join(__dirname, '..', 'swagger-ui/dist')));

    // Extend swagger ui with custom assets or not
    if (options && options.custom && options.custom.folder) {
      app.use(options.swaggerURL, express.static(options.custom.folder));
    }

    // define main UI files (the custom index file)
    swaggerUI = path.join(__dirname, '..', 'swagger-ui/dist');

    // Serve up the index file asset for the swagger ui
    swHandler = express.static(swaggerUI);

    this.setDefaultUrl(this.options.basePath + this.options.swaggerJSON, swaggerUI);

    // Serve up swagger ui interface.
    swaggerURL = new RegExp('^' + this.options.swaggerURL + '(/.*)?$');

    app.get(swaggerURL, function(req, res, next) {
      // express static barfs on root url w/o trailing slash
      if (req.url === this.options.swaggerURL) {
        res.writeHead(302, { Location: req.url + '/' });
        res.end();
        return;
      }

      // take off leading /swagger so that
      // connect locates file correctly
      req.url = req.url.substr(this.options.swaggerURL.length);
      return swHandler(req, res, next);
    });
  }
  middleware(req, res, next) {
    const regex = new RegExp('^' + this.options.fullSwaggerJSONPath + '(/.*)?$');

    const match = regex.exec(req.path);

    if (match) {
      res.set({
        'Access-Control-Allow-Origin': '*',
      });
      return res.json(_.clone(descriptor));
    }

    return next();
  }
  */
}

module.exports = new SwaggerService();
