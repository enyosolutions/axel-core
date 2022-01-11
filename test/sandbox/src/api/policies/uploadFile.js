/**
 * isAuthorized
 *
 * @description :: Policy to check if user is authorized with JSON web token
 */

const multer = require('multer');
const path = require('path');
const mime = require('mime');
const { Utils } = require('axel-core');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.resolve(`${process.cwd()}/public/data/uploads`));
  },
  filename(req, file, cb) {
    cb(null, `${Utils.md5(`${Date.now()}-${file.originalname}`)}.${mime.getExtension(file.mimetype)}`);
  }
});

module.exports = multer({
  storage
}).single('file');
