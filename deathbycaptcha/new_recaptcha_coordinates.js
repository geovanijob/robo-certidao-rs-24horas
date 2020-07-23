const dbc = require('./deathbycaptcha.js');

const username = 'username/authtoken';     // DBC account username
const password = 'password/authtoken';     // DBC account password

// you can use authentication token on DBC api
// authentication token must be enabled in the users panel
// when using authentication token username = 'authtoken' and password = 'token_from_panel'


const captcha_file = 'test.jpg';    // Image filename

// Death By Captcha Socket Client
// const client = new dbc.SocketClient(username, password);
// Death By Captcha http Client
const client = new dbc.HttpClient(username, password);

// Get user balance
client.get_balance((balance) => {
  console.log(balance);
});

// Solve captcha with type 2 extra argument
client.decode({captcha: captcha_file, extra: {type: 2}}, (captcha) => {

  if (captcha) {
    console.log('Captcha ' + captcha['captcha'] + ' solved: ' + captcha['text']);
    // Report an incorrectly solved CAPTCHA.
    // Make sure the CAPTCHA was in fact incorrectly solved!
    // client.report(captcha['captcha'], (result) => {
    //   console.log('Report status: ' + result);
    // });
  };

});
