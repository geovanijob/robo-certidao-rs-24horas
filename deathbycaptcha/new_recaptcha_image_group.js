const dbc = require('./deathbycaptcha.js');

const username = 'username/authtoken';     // DBC account username
const password = 'password/authtoken';     // DBC account password

// you can use authentication token on DBC api
// authentication token must be enabled in the users panel
// when using authentication token username = 'authtoken' and password = 'token_from_panel'

const captcha_file = 'test2.jpg';           // Captcha image filename
const banner = 'banner.jpg';                // Banner image filename
const banner_text = 'select all pizza:';    // Banner text

// Death By Captcha Socket Client
// const client = new dbc.SocketClient(username, password);
// Death By Captcha http Client
const client = new dbc.HttpClient(username, password);

// Get user balance
client.get_balance((balance) => {
  console.log(balance);
});

// Solve captcha with type 3, banner & banner_text extra arguments
client.decode({captcha: captcha_file, extra: {type: 3, banner: banner, banner_text: banner_text}}, (captcha) => {

  // you can supply optional `grid` argument to decode() call, with a
  // string like 3x3 or 2x4, defining what grid individual images were located at
  // example:
  // captcha = client.decode({captcha: captcha_file, extra: {type: 3, banner: banner, banner_text: banner_text, grid: "2x4"}, (captcha) => {
  //   ...
  // });
  // see 2x4.png example image to have an idea what that images look like
  // If you wont supply `grid` argument, dbc will attempt to autodetect the grid

  if (captcha) {
    console.log('Captcha ' + captcha['captcha'] + ' solved: ' + captcha['text']);
    // Report an incorrectly solved CAPTCHA.
    // Make sure the CAPTCHA was in fact incorrectly solved!
    // client.report(captcha['captcha'], (result) => {
    //   console.log('Report status: ' + result);
    // });
  }

});
