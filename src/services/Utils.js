/* eslint-disable no-underscore-dangle */
// const mongo =  require('mongodb');
const crypto = require('crypto');
const stringify = require('json-stringify-safe');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const _ = require('lodash');

const { ExtendedError } = require('./ExtendedError.js');
const ErrorUtils = require('./ErrorUtils.js'); // adjust path as needed
const axel = require('../axel.js');

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
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars`
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
        errors: ['missing_id']
      });
    }

    if (id.length < 24 && Number.isNaN(Number(id))) {
      axel.logger.warn('WRONG ID :: ', id);
      resp.status(404).json({
        errors: ['wrong_id_format'],
        message: 'wrong_id_format'
      });
      return false;
    }
    return true;
  },

  /**
   *
   * Inject userId if required£
   */
  injectUserId(data, user, fields = null) {
    if (!fields) {
      fields = ['userId'];
    }
    if (typeof fields === 'string') {
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
   * @param {import('express').Request} req
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
      createdOn: undefined
    },
    options = {}
  ) {
    if (req.query.options) {
      options.searchMode = options.searchMode || (req.query.options && req.query.options.searchMode);
    }
    // filters from the ui. Ex table fields
    if (req.query.filters && _.isObject(req.query.filters)) {
      const filters = req.query.filters;
      Object.keys(filters)
        .filter(f => filters[f])
        .forEach((i) => {
          // REMOVE INCLUDE $relation FROM query because it's managed else where
          if (i === '$relation') {
            delete req.query.filters[i];
          }
          if (filters[i]) {
            const myFilters = req.query.filters[i];

            if (Array.isArray(myFilters)) {
              query[i] = { [Op.in]: myFilters };
            } else if (_.isObject(myFilters)) {
              if (Object.keys(myFilters).length > 1) {
                query[i] = { [Op.and]: [] };
                Object.keys(myFilters).forEach((filter) => {
                  query[i][Op.and].push(this.getQueryForFilter(filter, myFilters[filter]));
                });
              } else {
                const key = Object.keys(myFilters)[0];
                query[i] = this.getQueryForFilter(key, myFilters[key], options.searchMode);
              }
            } else {
              query[i] = this.sqlFormatForSearchMode(myFilters, options.searchMode);
            }

            if (i.includes('.')) {
              if (!query[Op.and]) {
                query[Op.and] = [];
              }
              const isMysql = axel.sqldb.options.dialect === 'mysql';
              if (isMysql) {
                query[Op.and].push(Sequelize.where(
                  Sequelize.fn('JSON_EXTRACT',
                    Sequelize.col(i.split('.')[0]),
                    Sequelize.literal(`'$.${i.split('.')[1]}'`)), query[i]
                ));
              }
              delete query[i];
              // i = Sequelize.fn('JSON_EXTRACT', Sequelize.col(i.split('.')[0]), `$.${i.split('.')[1]}`);
            }
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
      let tags;
      if (_.isArray(req.query.tags)) {
        tags = req.query.tags;
      } else {
        tags = _.isString(req.query.tags)
          ? req.query.tags.split(',')
          : [];
      }
      query.tags = {
        $all: tags
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


  getQueryForFilter(filter, value, searchMode = 'start') {
    switch (filter) {
      case '$isNull':
        return { [Op.is]: null };
      case '$isNotNull':
        return { [Op.not]: null };
      case '$isDefined':
        return {
          [Op.not]: null,
          [Op.ne]: ''
        };
      case '$isNotDefined':
        return {
          [Op.or]: [
            { [Op.is]: null },
            { [Op.eq]: '' }
          ]
        };
      case '$startsWith':
        return { [Op[filter.replace('$', '')]]: `${value}%` };
      case '$endsWith':
        return { [Op[filter.replace('$', '')]]: `%${value}` };
      case '$like':
      case '$notLike':
      case '$substring':
        return { [Op[filter.replace('$', '')]]: `%${value}%` };
      case '$eq':
      case '$ne':
      case '$gt':
      case '$gte':
      case '$lt':
      case '$lte':
      case '$in':
      case '$notIn':
        return { [Op[filter.replace('$', '')]]: value };
      case '$between':
      case '$notBetween':
        return { [Op[filter.replace('$', '')]]: [value.from, value.to] };
      case '$custom':
        return value;
      default:
        if (searchMode === 'exact') {
          return this.sqlFormatForSearchMode(value, searchMode);
        }
        return this.sqlFormatForSearchMode(value, searchMode);
    }
  },


  /**
   * Inject params from the request into the include array that we'll user to include relation from the database
   * @param req
   * @param include
   * @returns {*[]}
   */
  injectIncludeParams(req, include = []) {
    if (req && req.query && req.query.filters && _.isObject(req.query.filters)) {
      Object.keys(req.query.filters).filter(f => req.query.filters[f]).forEach((i) => {
        if (i === '$relation') {
          const filtersInclude = req.query.filters[i];
          if (_.isObject(filtersInclude)) {
            let tempInclude = {};
            Object.keys(filtersInclude).forEach((filterInclude) => {
              tempInclude = _.merge(tempInclude, this.convertPathToInclude(filterInclude, filtersInclude[filterInclude].$eq));
            });
            include.push(tempInclude);
          }
        }
      });
    }
    return include;
  },

  /**
   * Convert path to sequelize include
   * eg: produit.disponibilites.id to
   * {
   *  as: 'produit',
   *  unscoped: true,
   *  required: true,
   *  include: [
   *    {
   *      as: 'disponibilites',
   *      unscoped: true,
   *      required: true,
   *      include: [],
   *      where: {
   *        id: VALUE
   *      }
   *    }
   *  ]
   * }
   * @param {String} dataPath
   * @param {String} dataValue
   * @returns
   */
  convertPathToInclude(dataPath, dataValue) {
    let baseInclude;
    const segments = dataPath.split('.');
    let previousSegment = null;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const inc = {
        association: segment,
        unscoped: true,
        required: true,
        include: []
      };
      if (i === 0) {
        inc.association = segment;
        previousSegment = inc;
        baseInclude = previousSegment;
        // eslint-disable-next-line
        continue;
      }
      if (i >= (segments.length - 1)) {
        if (!previousSegment.attributes) {
          previousSegment.attributes = [];
        }
        previousSegment.attributes.push(segment);
        if (!previousSegment.where) {
          previousSegment.where = {};
        }
        previousSegment.where[segment] = dataValue;
        // eslint-disable-next-line
        continue;
      }
      if (!previousSegment.include) {
        previousSegment.include = [];
      }
      previousSegment.include.push(inc);
      previousSegment = inc;
    }
    return baseInclude;
  },

  injectMongoSortParams(req, options = {}) {
    if (!options.sort) {
      if (req.query.sort && _.isObject(req.query.sort)) {
        const sort = req.query.sort;
        options.sort = {};
        Object.keys(sort).forEach((i) => {
          options.sort[i] = parseInt(sort[i]);
        });
      } else {
        options.sort = {
          createdOn: -1
        };
      }
    }
    return options;
  },

  injectPaginationQuery(
    req,
    options = {
      sort: null,
      model: null
    }
  ) {
    const isListOfValues = req.query.listOfValues ? !!req.query.listOfValues : false;
    const startPage = req.query.page ? _.toNumber(req.query.page) : 0;
    const endpoint = req.endpoint || req.params.endpoint || req.modelName;
    let limit;
    if (isListOfValues) {
      limit = axel.config.framework.defaultLovPagination;
    } else {
      limit = req.query.perPage
        ? req.query.perPage
        : axel.config.framework.defaultPagination;
    }
    limit = _.toNumber(limit);
    let offset = 0;
    if (axel.config.paginationStartsAtZero) {
      offset = startPage * limit;
    } else {
      offset = (startPage > 0 ? startPage - 1 : 0) * limit;
    }

    const sortOptions = req.query.sort || options.sort;
    let order = sortOptions ? _.toPairs(sortOptions) : [];

    // skip nested attributes for sorting.
    order = order.filter(o => !o[0].includes('.'));
    /*
    order = order.map((o) => {
      if (o[0].includes('.')) {
        const path = o[0].split('.');
        const model = axel.models?.[endpoint]?.em;
        if (model) {

          const attribute = model.rawAttributes[path[0]];
          if (attribute && attribute.type instanceof Sequelize.DataTypes.JSON) {
            return [`${path[0]}->'$.${path[1]}'`, o[1]];
          }
          return [`${path[0]}.${path[1]}`, o[1]];
        }
        else {

          return [
            Sequelize.fn('JSON_EXTRACT', path[0], '$.${path[1]}'`, o[1]];
        }
      }
      return o;
    });
    */

    let attributes = req.query.fields;
    if (req.query.excludeFields) {
      attributes = { exclude: attributes };
    }
    return {
      listOfValues: isListOfValues,
      startPage,
      limit,
      offset,
      order,
      attributes,
    };
  },

  injectSearchParams(req, query = {}) {
    if (req.query.search) {
      if (typeof req.query.search === 'string') {
        req.query.search = req.query.search.trim();
      }
      query.$text = {
        $search: req.query.search,
        $language: req.query.locale || 'en'
      };
    }

    return query;
  },

  injectSqlSearchParams(
    searchParam,
    query = {},
    options = {
      modelName: '',
      fields: undefined
    }
  ) {
    if ((!options.modelName || !axel.models[options.modelName]) && !options.fields) {
      throw new Error('search_params_injections_missing_model_name');
    }
    let search = searchParam;
    if (typeof search === 'object' && !Array.isArray(search)) {
      console.warn('search_params_injections_search_is_object. This is not supported anymore. Please use a string.', search);
      searchParam = search && search.query && search.query.search ? search.query.search : JSON.stringify(search);
    }
    const isPg = axel.sqldb.options.dialect === 'postgres';
    if (search) {
      search = Array.isArray(search) ? search : [search];

      const params = {};
      if (!query[Op.or]) {
        query[Op.or] = [];
      }
      let fields;
      if (options.modelName) {
        const dataModel = axel.models[options.modelName].entity;
        fields = Object.keys(dataModel.attributes);
      }
      // if we have a searchable fields list, we use it
      if (axel.models[options.modelName].searchableFields
        && Array.isArray(axel.models[options.modelName].searchableFields)
        && axel.models[options.modelName].searchableFields.length > 0) {
        fields = axel.models[options.modelName].searchableFields;
      }
      if (options.fields) {
        fields = options.fields;
      }
      if (fields) {
        search.forEach((s) => {
          fields.forEach((i) => {
            query[Op.or].push(
              isPg
                ? Sequelize.where(
                  Sequelize.cast(Sequelize.col(i), 'text'),
                  { [Op.iLike]: `%${s}%` }
                )
                : {
                  [i]: {
                    [Op.like]: `%${s}%`
                  }
                }
            );
          });
        });
      }
    }
    console.warn('search_params_injections_search_is_object. This is not supported anymore. Please use a string.', query);

    return query;
  },

  /**
 * Removes undefined fields from the object query since the cause sequelize to crash
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
    const endpoint = _.isString(req) ? req : (req.params.endpoint || req.endpoint || req.modelName);
    if (!axel.models[endpoint] || !axel.models[endpoint].em) {
      console.warn('THE REQUESTED ENDPOINT [', endpoint, '] DOES NOT EXISTS. source: ', req.method, req.url);
      if (res) {
        res.status(404).json({
          errors: ['model_not_found_error'],
          message: 'model_not_found_error'
        });
      }

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

  sanitizeUser(user) {
    return _.omitBy(user, (value, field) => field.match(/(password|token|google|facebook|passwd)/gi));
  }


};

module.exports = Utils;
