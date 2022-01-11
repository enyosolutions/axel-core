const _ = require('lodash');

module.exports = {
  collection: 'activity_log',
  defaultOptions: {
    depth: 6,
    prefix: '',
    entity: '',
    userId: ''
  },
  log(oldObject, newObject, options) {
    options.entityId = `${options.entityId || (newObject ? newObject._id : oldObject._id)}`;
    let changes = this.compare(oldObject, newObject, options);
    changes = changes.map(elm => ({
      insertOne: elm
    }));
    if (changes.length > 0) {
      return axel.mongodb.get('activity_log').bulkWrite(changes).catch((err) => {
        axel.log.error(err);
      });
    }
    return false;
  },
  /**
   * compare two objects and return a list of changes operated on the object
   * @method
   * @param  {[type]} oldObject     [description]
   * @param  {[type]} newObject     [description]
   * @param  {Object ={depth: 0, prefix : "" , entity:"", userId: ""} } options [description]
   * @return {[type]}         [description]
   */
  compare(oldObject = null, newObject = null, options = {
    depth: 0,
    prefix: '',
    entity: '',
    userId: ''
  }) {
    options = _.merge({}, this.defaultOptions, options);
    let changes = [];
    if (!oldObject && !newObject) {
      return [];
    }
    if (!oldObject) {
      return [{
        field: '',
        oldValue: '',
        newValue: '',
        action: 'created',
        entity: options.entity,
        entityId: options.entityId,
        comment: '',
        userId: options.userId,
        createdOn: new Date()
      }];
    }
    if (!newObject) {
      return [{
        field: '',
        oldValue: '',
        newObject: '',
        action: 'deleted',
        entity: options.entity,
        entityId: options.entityId,
        comment: '',
        userId: options.userId,
        createdOn: new Date()
      }];
    }

    const oldKeys = _.uniq(Object.keys(oldObject).concat(Object.keys(newObject)));
    const idxId = oldKeys.indexOf('_id');
    if (idxId > -1) {
      oldKeys.splice(idxId, 1);
    }
    // for each key compare the content changes
    for (let i = 0, ln = oldKeys.length; i < ln; i += 1) {
      const key = oldKeys[i];
      let change = {
        field: (options.prefix ? `${options.prefix}.` : '') + key,
        oldValue: '',
        newValue: '',
        action: '',
        entity: options.entity,
        entityId: options.entityId,
        comment: '',
        userId: options.userId,
        createdOn: new Date()
      };
      if (!oldObject[key]) { // added property
        change.action = 'added';
        change.newValue = newObject[key];
      } else if (!newObject[key]) { // deleted property
        change.action = 'deleted';
        change.oldValue = oldObject[key];
      } else if (!_.isObject(oldObject[key])) { // string / int / float / etc
        change.action = 'modified';

        change.oldValue = oldObject[key];
        change.newValue = newObject[key];
      } else if (_.isArray(oldObject[key])) { // array.
        change.action = 'modified';
        change.oldValue = JSON.stringify(oldObject[key]);
        change.newValue = JSON.stringify(newObject[key]);
      } else if (_.isObject(oldObject[key])) { // object that need recursion
        if (key === 'metadata') {
          /* eslint-disable */
          continue;
          /* eslint-enable */
        }
        if (options.depth > 0) {
          change = null;
          const newOptions = _.cloneDeep(options);
          newOptions.depth -= 1;
          newOptions.prefix = (options.prefix ? `${options.prefix}.` : '') + key;
          const subChanges = this.compare(oldObject[key], newObject[key], newOptions);
          changes = changes.concat(subChanges);
          // for(let change of subChanges){
          //     changes.push(change);
          // }
        } else {
          change.action = 'modified';
          change.oldValue = JSON.stringify(oldObject[key]);
          change.newValue = JSON.stringify(newObject[key]);
        }
      }
      if (change && change.oldValue !== change.newValue) {
        changes.push(change);
      }
    }
    return changes;
  }
};
