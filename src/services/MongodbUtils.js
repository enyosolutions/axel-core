const _ = require('lodash');

module.exports = {
  /**
   * Inject params from the request into the query object that we'll user to query the database
   */
  injectMongodbQueryParams(req, query = {}) {
    if (typeof query !== 'object') {
      throw new Error('missing or wrong query arg');
    }
    if (req.query.filters && _.isObject(req.query.filters)) {
      Object.keys(req.query.filters).forEach((i) => {
        query[i] = req.query.filters[i];
      });
    }

    if (req.query.tags) {
      const tags = _.isArray(req.query.tags) ? req.query.tags : req.query.tags.split(',');
      query.tags = {
        $all: tags
      };
    }


    if (req.query.range) {
      if (req.query.range.startDate) {
        if (!query.$and) {
          query.$and = [];
        }
        query.$and.push({
          createdOn: {
            $gte: new Date(req.query.range.startDate)
          }
        });
      }

      if (req.query.range.endDate) {
        if (!query.$and) {
          query.$and = [];
        }
        query.$and.push({
          createdOn: {
            $lte: new Date(req.query.range.endDate)
          }
        });
      }
    }

    ['userId'].forEach((elm) => {
      if (req.query[elm]) {
        const ids = _.isArray(req.query[elm]) ? req.query[elm] : [req.query[elm]];
        query[elm] = {
          $in: ids
        };
      }
    });


    // automatic override of all queries params
    if (req.query.query) {
      query = req.query.query;
    }

    return query;
  },


  injectMongodbSortParams(req, options) {
    if (!options.sort) {
      if (req.query.sort) {
        options.sort = {};
        Object.keys(req.query.sort).forEach((i) => {
          let direction = req.query.sort[i];
          if (_.isString(direction)) {
            if (direction.toString().toLowerCase() === 'asc') {
              direction = 1;
            }
            if (direction.toString().toLowerCase() === 'desc') {
              direction = -1;
            }
          }
          options.sort[i] = parseInt(direction);
        });
      } else if (req.query && req.query.listOfValues) {
        options.sort = {
          lastname: 1,
          firstname: 1,
          name: 1,
          title: 1,
          company: 1
        };
      } else {
        options.sort = {
          createdOn: -1
        };
      }
    }
    return options;
  },

};
