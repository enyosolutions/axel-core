import _ from 'lodash';
const nodemailer = require('nodemailer');

declare const axel: any;

type recipientType =
  | string
  | string[]
  | { email: string; name?: string }
  | Array<{ email: string; name?: string }>;

const MailService = {
  defaultData: {
    title: '',
    layout: 'email-template',
  },
  sendPasswordReset(email: string, data?: any) {
    const mergedData = _.merge({}, this.defaultData, data);
    mergedData.title = 'Mot de passe oublié';
    return axel.renderView('emails/account-reset', mergedData, (err: Error, html: string) => {
      if (err) return axel.logger.warn(err);
      MailService.sendMail(email, mergedData.title, html);
    });
  },

  sendUserCreated(user: { firstName: string; lastName: string; email: string }) {
    const data: any = _.merge({}, this.defaultData);
    data.title = 'Bienvenue';
    data.user = user;

    return axel.renderView('emails/account-created', data, (err: Error, html: string) => {
      if (err) return axel.logger.warn(err);
      MailService.sendMail(user.email, data.title, html);
    });
  },

  sendEmailConfirmation(user: { firstname: string; lastname: string; email: string }) {
    const data: any = _.merge({}, this.defaultData);
    data.title = 'Email address confirmation';
    data.user = user;
    return axel.renderView('emails/account-reset', data, (err: Error, html: string) => {
      if (err) return axel.logger.warn(err);
      MailService.sendMail(user.email, data.title, html);
    });
  },

  getTransport() {
    let transporter;

    // create Nodemailer SES transporter
    switch (axel.config.mail.transport) {
      case 'aws':
        const sesTransport = require('nodemailer-ses-transport');
        transporter = nodemailer.createTransport(
          sesTransport({
            accessKeyId: axel.config.awsSES.auth.user,
            secretAccessKey: axel.config.awsSES.auth.pass,
            region: axel.config.awsSES.auth.region,
          }),
        );
        break;
      case 'sendgrid':
        const sgTransport = require('nodemailer-sendgrid-transport');
        transporter = nodemailer.createTransport(sgTransport(axel.config.sendgrid));
        break;
      case 'gmail':
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 25,
          secure: true,
          auth: {
            type: 'OAuth2',
            // user: options.from || axel.config.mail.from,
            // accessToken: EmailFetcher.auth.accessToken
          },
        });
        break;
      case 'smtp':
      default:
        transporter = nodemailer.createTransport(axel.config.mail.options);
        break;
    }
    return transporter;
  },

  sendMail(email: recipientType, subject: string, body: string, options = {}) {
    return new Promise((resolve, reject) => {
      const transporter = MailService.getTransport();

      let mailOptions = {
        to: email,
        from: axel.config.mail.from,
        subject,
        html: body,
        status: '',
      };
      mailOptions = _.merge(mailOptions, options);
      try {
        transporter.sendMail(mailOptions, (err: Error) => {
          if (err) {
            console.log('[err] => ', err);
            // axel.logger.warn('error while sending Email');
            axel.logger.warn('error while sending Email', err);
            axel.logger.warn('***');
            axel.logger.warn('***');
            axel.logger.warn('***');
            mailOptions.status = 'notsent';
            reject(err);
          } else {
            axel.logger.verbose('** ');
            axel.logger.verbose('** Email sent');
            axel.logger.verbose('** ');
            mailOptions.status = 'sent';
            resolve(true);
          }
          if (axel.mongodb) {
            axel.mongodb.get('sent_mail').insert(mailOptions);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  },

  sendMailinglistThankyou(user: any, data?: any) {
    return new Promise((resolve, reject) => {
      const mergedData = _.merge({}, this.defaultData, data);
      mergedData.title = 'Thank you';
      mergedData.layout = 'email-template';
      mergedData.user = user;

      axel.renderView('emails/mailinglist-thankyou', mergedData, (err: Error, html: string) => {
        if (err) return axel.logger.warn(err) && reject(err);
        resolve(MailService.sendMail(user.email, mergedData.title, html));
      });
    });
  },

  sendEnquiryConfirm(user: any, data?: any) {
    return new Promise((resolve, reject) => {
      const mergedData = _.merge({}, this.defaultData, data);
      mergedData.title = 'Thank you';
      mergedData.layout = 'email-template';
      mergedData.user = user;

      axel.renderView('emails/enquiry-confirm', mergedData, (err: Error, html: string) => {
        if (err) return axel.logger.warn(err) && reject(err);
        resolve(MailService.sendMail(user.email, mergedData.title, html));
      });
    });
  },
};

export default MailService;
