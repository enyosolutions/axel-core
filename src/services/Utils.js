// const mongo =  require('mongodb');
const crypto = require('crypto');
const stringify = require('json-stringify-safe');
const Sequelize = require('sequelize');
const _ = require('lodash');
const { ExtendedError } = require('./ExtendedError.js');
const ErrorUtils = require('./ErrorUtils.js'); // adjust path as needed

// declare const Sequelize;


const Utils = {
  md5(str) {
    return crypto
      .createHash('md5')
      .update(str)
      .digest('hex');
  },
  formUrlEncoded(x) {
    return Object.keys(x).reduce((p, c) => `${p}&${c}=${encodeURIComponent(x[c])}`, '');
  },
  slugify(text) {
    const a = 'àáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;';
    const b = 'aaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------';
    const p = new RegExp(a.split('').join('|'), 'g');

    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special chars
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .trim();
  },

  safeError: ErrorUtils.safeError,
  sendError: ErrorUtils.sendError,
  stringToError: ErrorUtils.stringToError,
  errorCallback: ErrorUtils.errorCallback,


  /**
   * check that the id has the correct mongoID format
   */
  checkIsMongoId: (id, resp) => {
    if (!id) {
      return resp.status(404).json({
        errors: ['missing_id'],
      });
    }

    if (id.length < 24 && Number.isNaN(Number(id))) {
      axel.logger.warn('WRONG ID :: ', id);
      resp.status(404).json({
        errors: ['wrong_id_format'],
        message: 'wrong_id_format',
      });
      return false;
    }
    return true;
  },

  /**
   *
   * Inject userId if required
   */
  injectUserId(data, user, fields = null) {
    if (!fields) {
      fields = ['userId'];
    }
    if (typeof (fields) === 'string') {
      fields = [fields];
    }
    const primaryKey = axel.config.framework.primaryKey;
    fields.forEach((f) => {
      if (!data[f] && user && user[primaryKey]) {
        data[f] = user[primaryKey];
      }
    });

    return data;
  },


  /**
 * Format a string for an sql search, by appending % where needed
 */
  sqlFormatForSearchMode(str, mode) {
    mode = mode || axel.config.framework.defaultApiSearchMode;
    const Op = Sequelize.Op;
    switch (mode) {
      default:
      case 'exact':
        return { [Op.eq]: str };
      case 'full':
      case 'wildcard':
        return { [Op.like]: `%${str}%` };
      case 'start':
        return { [Op.like]: `${str}%` };
    }
  },


  /**
   *
   */
  /**
   *
   * Inject params from the request into the query object that we'll user to query the database
   * @param {Request} req
   * @param {*} [query={
   *       userId: undefined,
   *       filters: undefined,
   *       tags: undefined,
   *       createdOn: undefined,
   *     }]
   * @returns
   */
  injectQueryParams(
    req,
    query = {
      userId: undefined,
      filters: undefined,
      tags: undefined,
      createdOn: undefined,
    },
    options = {}
  ) {
    if (req.query.options) {
      options.searchMode = options.searchMode || (req.query.options && req.query.options.searchMode);
    }
    const Op = Sequelize.Op;
    // filters from the ui. Ex table fields
    // @deprecated use _filters
    if (req.query.filters && _.isObject(req.query.filters)) {
      const filters = req.query.filters;
      Object.keys(filters)
        .filter(f => filters[f])
        .forEach((i) => {
          if (filters[i]) {
            query[i] = Utils.sqlFormatForSearchMode(filters[i], options.searchMode);
          }
        });
    }

    // filters from the ui. Ex table fields
    if (req.query._filters && _.isObject(req.query._filters)) {
      const filters = req.query._filters;
      Object.keys(filters)
        .filter(f => filters[f])
        .forEach((i) => {
          if (filters[i]) {
            query[i] = { [Op.like]: `${filters[i]}%` };
          }
        });
    }

    if (req.query.tags && _.isObject(req.query.tags)) {
      const tags = _.isArray(req.query.tags)
        ? req.query.tags
        : _.isString(req.query.tags)
          ? req.query.tags.split(',')
          : [];
      query.tags = {
        $all: tags,
      };
    }

    if (req.query.range && _.isObject(req.query.range)) {
      const { startDate, endDate } = req.query.range;
      if (startDate && (_.isString(startDate) || _.isNumber(startDate))) {
        if (!query.createdOn) {
          query.createdOn = {};
        }
        query.createdOn[Op.gte] = new Date(startDate);
      }

      if (endDate && (_.isString(endDate) || _.isNumber(endDate))) {
        if (!query.createdOn) {
          query.createdOn = {};
        }
        query.createdOn[Op.lte] = new Date(endDate);
      }
    }

    const userId = req.params.userId || req.query.userId;
    if (userId) {
      query.userId = userId;
    }

    // automatic override of all queries params
    // if (req.query.query) {
    //   query = req.query.query;
    // }
    return query;
  },

  injectSortParams(req, options = {}) {
    if (!options.sort) {
      if (req.query.sort && _.isObject(req.query.sort)) {
        const sort = req.query.sort;
        options.sort = {};
        Object.keys(sort).forEach((i) => {
          options.sort[i] = parseInt(sort[i]);
        });
      } else {
        options.sort = {
          createdOn: -1,
        };
      }
    }
    return options;
  },

  injectPaginationQuery(
    req,
    options = {
      sort: null,
      primaryKey: '',
    },
  ) {
    const isListOfValues = req.query.listOfValues ? !!req.query.listOfValues : false;
    const startPage = req.query.page ? _.toNumber(req.query.page) : 0;
    const primaryKey = axel.config.framework.primaryKey;

    let limit = isListOfValues
      ? axel.config.framework.defaultLovPagination
      : req.query.perPage
        ? req.query.perPage
        : axel.config.framework.defaultPagination;
    limit = _.toNumber(limit);
    const offset = startPage * limit;
    const sortOptions = req.query.sort || options.sort;
    const order = _.toPairs(
      sortOptions || { [options.primaryKey || primaryKey]: 'DESC' },
    );
    return {
      listOfValues: isListOfValues,
      startPage,
      limit,
      offset,
      order,
    };
  },

  injectSearchParams(req, query = {}) {
    if (req.query.search) {
      if (typeof req.query.search === 'string') {
        req.query.search = req.query.search.trim();
      }
      query.$text = {
        $search: req.query.search,
        $language: req.query.locale || 'en',
      };
    }

    return query;
  },

  injectSqlSearchParams(
    req,
    query = {},
    options = {
      modelName: '',
      fields: undefined,
    },
  ) {
    const Op = Sequelize.Op;
    if ((!options.modelName || !axel.models[options.modelName]) && !options.fields) {
      throw new Error('search_params_injections_missing_model_name');
    }
    if (req.query.search) {
      const params = {};
      if (!query[Op.or]) {
        query[Op.or] = [];
      }
      let fields;
      if (options.modelName) {
        const dataModel = axel.models[options.modelName].entity;
        fields = Object.keys(dataModel.attributes);
      } else {
        fields = options.fields;
      }
      if (fields) {
        fields.forEach((i) => {
          query[Op.or].push({ [i]: { [Op.like]: `%${req.query.search}%` } });
        });
      }
    }

    return query;
  },

  /**
   * Removes undefiend fields from the object query since the cause sequelize to crash
   * @param query
   */
  cleanSqlQuery(query) {
    if (!query) {
      return query;
    }
    Object.keys(query).forEach((key) => {
      if (query[key] === undefined) {
        delete query[key];
      }
    });
    return query;
  },

  removeAdditionalProperty(scheme, data) {
    return _.pick(data, _.keys(scheme.schema.properties));
  },

  dashedToNormal(str) {
    return str.replace(/\s+/g, '-').toLowerCase();
  },

  formatName(firstname = null, lastname = null, company = null, optional = false) {
    let name = '';
    if (!firstname && !lastname && !company) {
      return name;
    }

    if (firstname || lastname) {
      name = `${firstname} ${lastname}`;
      if (company && !optional) {
        name += ` [${company}]`;
      }
    } else {
      name = company;
    }

    return name ? name.trim() : '';
  },

  objectTrim(item) {
    Object.keys(item).forEach((key) => {
      if (_.isString(item[key])) {
        item[key] = item[key].trim();
      }
    });
    return item;
  },

  validateDate(date) {
    const timestamp = Date.parse(date);
    if (Number.isNaN(timestamp) === true) {
      return false;
    }
    return true;
  },

  getEntityManager(req, res) {
    const endpoint = _.isString(req) ? req : req.params.endpoint;
    if (!axel.models[endpoint] || !axel.models[endpoint].repository) {
      console.warn('REQUESTED  ENDPOINT', endpoint, 'DOES NOT EXISTS');
      res.status(404).json({
        errors: ['model_not_found_error'],
        message: 'model_not_found_error',
      });
      return false;
    }
    return axel.models[endpoint].em;
  },

  getRawObject(item) {
    if (Array.isArray(item)) {
      return item.map(Utils.getRawObject);
    }

    if (item.rows && Array.isArray(item.rows)) {
      return item.rows.map(Utils.getRawObject);
    }

    const output = item.get();
    /* eslint-disable no-underscore-dangle,no-unused-expressions */
    item._options.includeNames
      && item._options.includeNames.forEach((inc) => {
        output[inc] = Utils.getRawObject(item[inc]);
      });
    return output;
  },
};

module.exports = Utils;
