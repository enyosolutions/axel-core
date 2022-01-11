const _ = require('lodash');
const moment = require('moment');

/**
* [exports description]
* @type {Object}
  data = {entity, entityId, data, text, body, userId, createdOn};
*/

const roundValue = value => Math.round(value * 100) / 100;

module.exports = {
  init() { },
  events: {
    generalGroupBy(event, filters, options = {
      dateField: 'createdOn',
      groupFunction: 'COUNT(*)'
    }) {
      return new Promise((resolve, reject) => {
        const results = {};
        const opts = Object.assign({}, filters);
        opts.eventTitle = event;

        const p1 = axel.models.event_tracking.em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`DATE(${options.dateField})`), 'day'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'day',
          raw: true,
        }).then((list) => {
          results.day = {
            list,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const p2 = axel.models.event_tracking.em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`CONCAT(CONCAT(YEAR(${options.dateField}), '-'),
             WEEK(${options.dateField})+1)`), 'week'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'week',
        }).then((list) => {
          results.week = {
            list: list ? list.map(listItem => ({
              value: listItem.value,
              week: moment(listItem.week, 'YYYY-WW').format('YYYY-MM-DD')
            })) : null,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const p3 = axel.models.event_tracking.em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`CONCAT(CONCAT(YEAR(${options.dateField}), '-'),
             MONTH(${options.dateField}))`), 'month'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'month',
          raw: true
        }).then((list) => {
          results.month = {
            list,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const p4 = axel.models.event_tracking.em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`YEAR(${options.dateField})`), 'year'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'year',
        }).then((list) => {
          results.year = {
            list: list ? list.map(listItem => ({
              value: listItem.value,
              year: moment(listItem.year.toString(), 'YYYY').format('YYYY-[01]-[01]')
            })) : null,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const promises = [p1, p2, p3, p4];

        Promise.all(promises).then(() => {
          resolve(results);
        }).catch(reject);
      });
    },
    groupByField(eventTitle, field = 'createdOn', filters, options = { groupFunction: 'COUNT(*)' }) {
      filters = filters || {};
      filters.eventTitle = eventTitle;
      return this.models.groupByField('event_tracking', field, filters, options);
    },
  },
  models: {
    generalGroupBy(table, filters, options = { dateField: 'createdOn', groupFunction: 'COUNT(*)', }) {
      return new Promise((resolve, reject) => {
        const results = {};
        const opts = Object.assign({}, filters);
        const p1 = axel.models[table].em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`DATE(${options.dateField})`), 'day'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'day',
          raw: true,
        }).then((list) => {
          results.day = {
            list,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const p2 = axel.models[table].em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`CONCAT(CONCAT(YEAR(${options.dateField}), '-'),
             WEEK(${options.dateField})+1)`), 'week'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'week',
        }).then((list) => {
          results.week = {
            list: list ? list.map(listItem => ({
              value: listItem.value,
              week: moment(listItem.week, 'YYYY-WW').format('YYYY-MM-DD')
            })) : null,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const p3 = axel.models[table].em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`CONCAT(CONCAT(YEAR(${options.dateField}), '-'),
             MONTH(${options.dateField}))`), 'month'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'month',
        }).then((list) => {
          results.month = {
            list,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const p4 = axel.models[table].em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.literal(`YEAR(${options.dateField})`), 'year'],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          group: 'year',
        }).then((list) => {
          results.year = {
            list: list ? list.map(listItem => ({
              value: listItem.value,
              year: moment(listItem.year.toString(), 'YYYY').format('YYYY-[01]-[01]')
            })) : null,
            total: list ? roundValue(list.reduce((reducer, current) => (current.value || 0) + reducer, 0)) : 0
          };
        }).catch(err => console.warn(err));

        const promises = [p1, p2, p3, p4];

        Promise.all(promises).then(() => {
          resolve(results);
        }).catch(reject);
      });
    },

    groupByField(table, field, filters, options = { groupFunction: 'COUNT(*)' }, include) {
      return new Promise((resolve, reject) => {
        const opts = Object.assign({}, filters);
        options = Object.assign({ groupFunction: 'COUNT(*)' }, options);

        const queryTableName = table;
        if (queryTableName) {
          // if (queryTableName.split('_').length > 1) {
          //   let tempTableName = '';
          //   queryTableName.split('_').forEach((element) => {
          //     tempTableName += element.charAt(0).toUpperCase() + element.slice(1);
          //   });
          //   queryTableName = tempTableName;
          // } else {
          //   queryTableName = queryTableName.charAt(0).toUpperCase() + queryTableName.slice(1);
          // }
        }

        const fieldSource = include ? `${queryTableName}.${field}` : field;

        if (!axel.models[table]) {
          return reject(new Error(`model_${table}_does_not_exists`));
        }
        axel.models[table].em.findAll({
          where: opts,
          attributes: [
            [axel.sqldb.col(fieldSource), field],
            [axel.sqldb.literal(options.groupFunction), 'value']
          ],
          ...(_.isArray(include) ? {
            include,
            raw: true
          } : {}),
          group: field,
        }).then((list) => {
          const results = {
            list,
            total: list ? roundValue(
              list.reduce((reducer, current) => (parseFloat(current.value) || 0) + parseFloat(reducer), 0)
            ) : 0
          };
          resolve(results);
        }).catch(err => reject(err));
      });
    },
  },
};
