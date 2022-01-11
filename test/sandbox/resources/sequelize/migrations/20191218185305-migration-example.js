

module.exports = {
  // eslint-disable-next-line
  up: (queryInterface, Sequelize) => {
    //   Add altering commands here.
    //   Return a promise to correctly handle asynchronicity.
    //   Example:
    //   return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    //  return queryInterface.createTable('monitoring_apps', tableModel.entity.attributes);
    return Promise.resolve();
  },

  // eslint-disable-next-line
  down: (queryInterface, Sequelize) => {
    //   Add reverting commands here.
    //   Return a promise to correctly handle asynchronicity.
    //   Example:
    return Promise.resolve();
    //    return queryInterface.dropTable('monitoring_apps');
  }
};
