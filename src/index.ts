export {Axel, ServerInitFunction, axel } from './axel';
import {axel} from './axel';
export  {Server}  from './Server';
export {router} from './router';
export {models} from './models';
export { ExtendedError } from './services/ExtendedError';
export * from './services/AxelAdmin';

// @ts-ignore
global.axel = axel;
// @ts-ignore

export default axel;