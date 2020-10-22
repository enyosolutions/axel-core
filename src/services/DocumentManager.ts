/**
 * [exports description]
 * @type {Object}
 *
 * document  {_id:string, externalId:string, name:string, url:string, data:string,
 *            type:string, mimetype: string, size: float, entity:string, entityId: FK}
 */

import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

let s3;
declare const axel: any;

const DocumenntManager = {
  storage: 'local',
  s3,
  // UPLOAD OF STARTUP PRODUCT PICTURES
  httpUpload(req: Request, options = { path: '' }) {
    const promise = new Promise((resolve, reject) => {
      // don't allow the total upload size to exceed ~10MB
      // @ts-ignore
      req.file('file').upload(
        {
          dirname: path.resolve('assets/data', options.path),
        },
        (err: Error, uploadedFiles: []) => {
          if (err) {
            return reject(err);
          }

          if (uploadedFiles.length === 0) {
            return reject(new Error('no_file_uploaded'));
          }

          resolve(uploadedFiles);
        },
      );
      //  adapter: require('skipper-s3'),
      // req.file('file').upload({
      //   maxBytes: req.body.maxSize || 2000000000,
      //   dirname: `../../assets/data/${options.path}`,
      // }, (err, uploadedFiles) => {
      //   if (err) {
      //     return reject(err);
      //   }

      //   // If no files were uploaded, respond with an error.
      //   if (uploadedFiles.length === 0) {
      //     return reject(new Error('No file was uploaded'));
      //   }

      //   const ext = uploadedFiles[0].filename.split('.').pop() || '';
      //   const hash = uploadedFiles[0].fd.split('/').pop();
      //   const path = `${options.path}/${hash}`;
      //   const cdnUrl = `${axel.config.appUrl}/data/${path}`;
      //   const awsUrl = `https://s3.${
      //     axel.config.aws.region
      //   }.amazonaws.com/${
      //     axel.config.aws.bucket
      //   }/${
      //     options.path
      //   }/${
      //     hash}`;

      //   const params = {
      //     Bucket: axel.config.aws.bucket,
      //     Key: `${options.path}/${hash}`,
      //     ACL: 'public-read',
      //     ContentType: uploadedFiles[0].type,
      //     Body: fs.readFileSync(uploadedFiles[0].fd)
      //   };
      //   this.s3.putObject(params, (errAws, awsData) => {
      //     let isAws;
      //     if (errAws) {
      //       isAws = false;
      //       axel.logger.warn('Error  while uploading data to myBucket/', errAws);
      //     } else {
      //       isAws = true;
      //       axel.logger.warn('Successfully uploaded data to myBucket/', awsData);
      //       fs.unlink(uploadedFiles[0].fd);
      //     }

      //     const out = {
      //       id: hash,
      //       size: uploadedFiles[0].size,
      //       mimetype: uploadedFiles[0].type,
      //       type: uploadedFiles[0].type,
      //       extension: ext,
      //       name: uploadedFiles[0].filename,
      //       path,
      //       url: isAws ? awsUrl : cdnUrl,
      //       awsId: awsData
      //     };
      //     resolve(out);
      //   });
      // });
    });
    return promise;
  },

  post(
    document: any,
    options = {
      storage: null,
      entity: null,
      entityId: null,
    },
  ) {
    axel.logger.info(options);
  },

  // duplicate(doc, options, entityId, entity) {
  //   if (_.isArray(doc)) {
  //     const promises = doc.map(data => this.duplicate(data, options, entityId, entity));
  //     return Promise.all(promises);
  //   }
  //   return new Promise((resolve, reject) => {
  //     const newKey = `${Date.now()}-${doc.id}`;

  //     const docCopy = _.clone(doc);
  //     delete docCopy.createdOn;
  //     delete docCopy.createdBy;
  //     delete docCopy.lastModifiedOn;
  //     delete docCopy.lastModifiedBy;
  //     delete docCopy._id;
  //     docCopy.entity = entity;
  //     docCopy.entityId = entityId;
  //     docCopy.createdOn = new Date();

  //     if (doc.awsId) {
  //       const params = {
  //         Bucket: axel.config.aws.bucket,
  //         CopySource: `${axel.config.aws.bucket}/${doc.path}`,
  //         Key: `${options.path}/${newKey}`,
  //         ACL: 'public-read'
  //       };

  //       this.s3.copyObject(params, (err, awsData) => {
  //         if (err) {
  //           reject(err);
  //         }
  //         docCopy.awsId = awsData;

  //         docCopy.url = `https://s3.${
  //           axel.config.aws.region
  //         }.amazonaws.com/${
  //           axel.config.aws.bucket
  //         }/${
  //           options.path
  //         }/${
  //           newKey}`;
  //         docCopy.id = newKey;
  //         docCopy.path = `${options.path}/${newKey}`;
  //         resolve(docCopy);
  //       });
  //       return;
  //     }
  //     // fixme duplicate of files that are in local system is not working
  //     try {
  //       if (doc.path) {
  //         fs.createReadStream(doc.path)
  //           .pipe(fs.createWriteStream(doc.path.replace(doc.key, docCopy.key)));
  //         docCopy.url = `${axel.config.appUrl}/data/${newKey}`;
  //       }
  //       resolve(docCopy);
  //     } catch (err) {
  //       if (err) {
  //         reject(err);
  //       }
  //     }
  //   });
  // },

  delete(doc: string) {
    return new Promise((resolve, reject) => {
      if (doc.indexOf('assets') !== -1) {
        doc = doc.substr(doc.indexOf('assets') + 6);
      }
      if (doc.indexOf(axel.config.appUrl) !== -1) {
        doc = doc.replace(axel.config.appUrl, '');
      }
      fs.unlink(`${process.cwd()}/assets/${doc}`, err => {
        if (err) {
          if (err.code && err.code === 'ENOENT') {
            resolve(true);
          }
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  },
};

export default DocumenntManager;
