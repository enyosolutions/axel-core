const _ = require('lodash');
const pkg = require('googleapis');

const { google } = pkg;

/** ******* */
/** MAIN  GOOGLE API* */
/** ******* */
const defaultScope = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/userinfo.email',
  'email',
  'openid',
];

function createConnection(redirectUrl) {
  return new google.auth.OAuth2(
    axel.config.google.clientId,
    axel.config.google.clientSecret,
    redirectUrl || axel.config.google.redirectUrl,
  );
}

function getConnectionUrl(auth, scope = null) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scope || defaultScope,
  });
}

function getPeopleApi() {
  return google.people('v1');
}

function getGoogleUrl(scope) {
  const auth = createConnection();
  google.options({ auth });
  const url = getConnectionUrl(auth, scope);
  return url;
}

function getGmailUrl(scope) {
  const auth = createConnection(`${axel.config.websiteUrl}/onboarding`);
  google.options({ auth });
  const url = getConnectionUrl(auth, scope || 'profile email openid https://www.googleapis.com/auth/gmail.modify');
  return url;
}

async function getGoogleAccountFromCode(code, redirectUrl) {
  const auth = createConnection(redirectUrl);
  const data = await auth.getToken(code);

  const tokens = data.tokens;
  auth.setCredentials(tokens);
  const peopleApi = google.people({ version: 'v1', auth });
  const me = await peopleApi.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses',
  });
  const userGoogleEmail = _.get(me, 'data.emailAddresses[0].value');
  return {
    email: userGoogleEmail,
    googleTokens: tokens,
    me: me.data,
  };
}


async function getGoogleAccountFromToken(token) {
  const auth = createConnection();
  auth.setCredentials(token);
  google.options({ auth });
  const peopleApi = getPeopleApi(auth);
  console.log('peopleApi', peopleApi);

  const me = await peopleApi.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses,names,photos',
  });

  if (!me || !me.data) {
    throw new Error('error_wrong_google_token');
  }

  const nameData = me.data.names && me.data.names && me.data.names[0];
  const email = me.data.emailAddresses && me.data.emailAddresses[0] && me.data.emailAddresses[0].value;

  return {
    googleId:
      nameData && nameData.metadata && nameData.metadata.source && nameData.metadata.source.id,
    email,
    firstName: nameData && nameData.givenName,
    lastName: nameData && nameData.familyName,
  };
}

module.exports = {
  getGoogleUrl,
  getGmailUrl,
  getGoogleAccountFromToken,
  getGoogleAccountFromCode,
};
