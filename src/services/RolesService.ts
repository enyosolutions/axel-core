
const _ = require('lodash');
import { Request, Response } from 'express';

declare const axel : any;

const RolesService = {
  getExtendedRoles(role: string) {
    let myRoles: string[] = [];
    if (
      axel.config.framework.roles[role] &&
      axel.config.framework.roles[role].inherits &&
      Array.isArray(axel.config.framework.roles[role].inherits)
    ) {
      myRoles = myRoles.concat(axel.config.framework.roles[role].inherits);
      axel.config.framework.roles[role].inherits.forEach((r: string) => {
        myRoles = myRoles.concat(RolesService.getExtendedRoles(r));
      });
    }
    return _.uniq(myRoles);
  },

  userIs(req: Request, role: string) {
    return req.user && req.user.roles && req.user.roles.indexOf(role) > -1;
  },

  hasAccess(user: any, requiredRoles: string[]) {
    if (!user) {
      return false;
    }
    if (typeof requiredRoles === 'string') {
      requiredRoles = [requiredRoles];
    }
    let myRoles = (user && user.roles) || user;
    // Check if role exists
    for (let i = 0; i < requiredRoles.length; i++) {
      const role = requiredRoles[i];
      if (!axel.config.framework.roles[role]) {
        console.warn(
          'ACTION REQUIRES AN INEXISTING ROLE',
          role,
          Object.keys(axel.config.framework.roles)
        );
        return false;
      }
    }

    myRoles.forEach((role: string) => {
      myRoles = myRoles.concat(RolesService.getExtendedRoles(role));
    });
    let canAccess = false;
    for (let i = 0; i < requiredRoles.length; i++) {
      const role = requiredRoles[i];
      if (myRoles.indexOf(role) > -1) {
        canAccess = true;
        break;
      }
    }

    return canAccess;
  },
};

export default RolesService;
