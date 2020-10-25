/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

import _ from 'lodash';
import AxelAdmin from '../services/AxelAdmin.js'; // adjust path as needed
/*
Uncomment if you need the following features:
- Create import template for users
- Import from excel
- Export to excel
*/

// import DocumentManager from '../../services/DocumentManager';
// import ExcelService from '../../services/ExcelService';

const entity = 'axelModelConfig';
const primaryKey =
  axel.models[entity] && axel.models[entity].primaryKeyField
    ? axel.models[entity].primaryKeyField
    : axel.config.framework.primaryKey;

class AxelAdminController {
  /**
   * @param  {[type]}
   * @param  {[type]}
   * @return {[type]}
   */
  models(req, res) {
    AxelAdmin.serveModels(req, res);
  }
}

export default new AxelAdminController();
