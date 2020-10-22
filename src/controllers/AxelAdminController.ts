/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

import { Request, Response } from 'express';
import _ from 'lodash';
import Utils from '../../common/services/Utils'; // adjust path as needed
import { ExtendedError } from '..'; // adjust path as needed
import AxelAdmin from '../services/AxelAdmin'; // adjust path as needed
/*
Uncomment if you need the following features:
- Create import template for users
- Import from excel
- Export to excel
*/

// import DocumentManager from '../../services/DocumentManager';
// import ExcelService from '../../services/ExcelService';

declare const axel: any;

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
  models(req: Request, res: Response): void {
    AxelAdmin.serveModels(req, res);
  }
}

export default new AxelAdminController();
