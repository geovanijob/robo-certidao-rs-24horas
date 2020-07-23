const dbc = require('./deathbycaptcha.js');

const username = 'govfacil';     // DBC account username
const password = 'Govfacil1010';     // DBC account password

// you can use authentication token on DBC api
// authentication token must be enabled in the users panel
// when using authentication token username = 'authtoken' and password = 'token_from_panel'

// Proxy and Recaptcha token data
const token_params = JSON.stringify({
  'proxy': '',
  'proxytype': '',
  'googlekey': '6LeQHh8TAAAAAIy0vAtOHLm62yhbmWxT9_HUoAnh',
  'pageurl': 'https://www.sefaz.rs.gov.br/sat/CertidaoSitFiscalSolic.aspx'
});

// Death By Captcha Socket Client
//const client = new dbc.SocketClient(username, password);
// Death By Captcha http Client
 const client = new dbc.HttpClient(username, password);

// Get user balance
client.get_balance((balance) => {
  console.log(balance);
});

// Solve captcha with type 4 & token_params extra arguments
client.decode({extra: {type: 4, token_params: token_params}}, (captcha) => {

  if (captcha) {
    console.log('Captcha ' + captcha['captcha'] + ' solved: ' + captcha['text']);
    // Report an incorrectly solved CAPTCHA.
    // Make sure the CAPTCHA was in fact incorrectly solved!
    // client.report(captcha['captcha'], (result) => {
    //   console.log('Report status: ' + result);
    // });
  }

});
