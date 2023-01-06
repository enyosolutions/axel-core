/* eslint-disable node/no-missing-require,import/no-unresolved,global-require */
const _ = require('lodash');
const debug = require('debug')('mailer');

const axel = require('../axel');

class MailService {
  constructor(nodemailer) {
    this.defaultData = {
      title: '',
      layout: 'email-template',
    };
    if (nodemailer) {
      this.nodemailer = nodemailer;
    }
    if (!axel.services) {
      axel.services = {};
    }
    axel.services.mail = this;
  }

  sendPasswordReset(email, data) {
    const mergedData = _.merge({}, this.defaultData, data);
    mergedData.title = 'Mot de passe oublié';
    return axel.renderView('emails/password-reset', mergedData).then((html) => {
      this.sendMail(email, mergedData.title, html, data);
    });
  }

  sendUserCreated(user) {
    const data = _.merge({}, this.defaultData);
    data.title = 'Bienvenue';
    data.user = user;

    return axel.renderView('emails/account-created', data).then((html) => {
      this.sendMail(user.email, data.title, html, data);
    });
  }

  sendEmailConfirmation(user) {
    const data = _.merge({}, this.defaultData);
    data.title = 'Email address confirmation';
    data.user = user;
    return axel.renderView('emails/password-reset', data).then((html) => {
      this.sendMail(user.email, data.title, html, data);
    });
  }

  getTransport() {
    if (this.transport) {
      return this.transport;
    }
    let transport;
    // eslint-disable-next-line no-case-declarations, import/no-dynamic-require, global-require
    const nodemailer = this.nodemailer || require('nodemailer');
    // create Nodemailer SES transport
    switch (axel.config.mail.transport) {
      case 'ses':
      case 'sendgrid':
      case 'mailgun':
      case 'sendinblue':
      case 'mailjet':
        // eslint-disable-next-line no-case-declarations, import/no-dynamic-require, global-require
        const transporter = require(`nodemailer-${axel.config.mail.transport}-transport`);
        transport = nodemailer.createTransport(
          transporter({
            ...axel.config.mail.config,
          })
        );
        break;
      case 'gmail':
        transport = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 25,
          secure: true,
          auth: {
            type: 'OAuth2',
            ...axel.config.mail.config,
          },
        });
        break;
      case 'smtp':
      default:
        transport = nodemailer.createTransport({
          ...axel.config.mail.options,
          ...axel.config.mail.config,
        });
        break;
    }
    this.transport = transport;
    return transport;
  }

  // eslint-disable-next-line no-unused-vars
  async sendMail(email, subject, body, data = {}, options = {}) {
    debug('sendmail', email, subject);
    if (process.env.AXEL_DISABLE_EMAILS) {
      axel.logger.log(
        'AXEL_DISABLE_EMAILS: disabled. Email [%s] not sent',
        subject
      );
      return Promise.resolve('emails_are_disabled');
    }
    const transport = this.transport || this.getTransport();

    let mailOptions = {
      to: email,
      from: axel.config.mail.from,
      subject,
      html: body,
      status: '',
    };
    mailOptions = _.merge(mailOptions, {});

    if (data && data.layout) {
      mailOptions.html = await axel.renderView(`emails/${data.layout}`, {
        ...data,
        body,
      });
    }

    if (this.beforeSend) {
      await this.beforeSend(mailOptions);
    }

    const result = await new Promise((resolve, reject) => {
      try {
        transport.sendMail(mailOptions, (err, info) => {
          if (err) {
            // axel.logger.warn('error while sending Email');
            axel.logger.warn('error while sending Email', err);
            axel.logger.warn('***');
            axel.logger.warn('***');
            axel.logger.warn('***');
            mailOptions.status = 'notsent';
            reject(err);
          } else {
            debug('** Email sent');
            debug('** ', info);
            mailOptions.status = 'sent';
            resolve(info);
          }
        });
      } catch (err) {
        debug(err.message);
        reject(err);
      }
    });

    if (this.beforeSend) {
      await this.beforeSend(mailOptions, result);
    }

    return result;
  }

  async beforeSend(mailObject) {
    return mailObject;
  }

  async afterSend(mailObject, result) {
    return { mailObject, result };
  }
}

module.exports = MailService;
