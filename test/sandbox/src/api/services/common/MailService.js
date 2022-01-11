const _ = require('lodash');
const nodemailer = require('nodemailer');


const logEmailError = (err) => {
  axel.logger.warn(err);
  throw err;
};

const MailService = {
  defaultData: {
    title: '',
    layout: 'email-template',
  },
  sendPasswordReset(email, data = {}) {
    const mergedData = _.merge({}, this.defaultData, data);
    mergedData.title = 'Mot de passe perdu';
    return axel.renderView('emails/account-reset', mergedData)
      .then(html => MailService.sendMail(email, mergedData.title, html))
      .catch(logEmailError);
  },

  sendUserCreated(user) {
    const data = _.merge({}, this.defaultData);
    data.title = 'Bienvenue';
    data.user = user;

    return axel.renderView('emails/account-created', data).then(html => MailService.sendMail(
      user.email,
      data.title,
      html
    ))
      .catch(logEmailError);
  },

  async sendEmailConfirmation(user) {
    const data = _.merge({}, this.defaultData);
    data.title = `${axel.config.appName || axel.config.app} - Confirmez votre adresse`;
    data.user = user;

    return axel.renderView('emails/account-created', data).then(html => MailService.sendMail(
      user.email,
      data.title,
      html
    ))
      .catch(logEmailError);
  },

  async getTransport() {
    let transporter;

    // create Nodemailer SES transporter
    switch (axel.config.mail.transport) {
        case 'aws':
        const sesTransport = require('nodemailer-ses-transport'); // eslint-disable-line
          transporter = nodemailer.createTransport(
            sesTransport({
              accessKeyId: axel.config.awsSES.auth.user,
              secretAccessKey: axel.config.awsSES.auth.pass,
              region: axel.config.awsSES.auth.region,
            }),
          );
          break;
        case 'sendgrid':
        const sgTransport = require('nodemailer-sendgrid-transport'); // eslint-disable-line
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

  sendMail(email, subject, body, options = {}) {
    if (process.env.AXEL_DISABLE_EMAILS) {
      return Promise.resolve();
    }

    return MailService.getTransport().then((transporter) => {
      let mailOptions = {
        to: email,
        from: axel.config.mail.from,
        subject,
        html: body,
        status: '',
      };

      mailOptions = _.merge(mailOptions, options);

      return new Promise((resolve, reject) => {
        try {
          transporter.sendMail(mailOptions, (err) => {
            if (err) {
              console.warn('[sendMail][err] => ', err);
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
    });
  },
};

module.exports = MailService;
module.exports.MailService = MailService;
