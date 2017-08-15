const webPage = require('webpage'),
  fs = require('fs'),
  // Promise = require(phantom.libraryPath + '/node_modules/bluebird/js/release/bluebird.js'),
  page = webPage.create(),
  config = require(phantom.libraryPath + '/config/config.json');

page.settings.userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36';
page.settings.javascriptEnabled = true;
page.settings.loadImages = false;
phantom.cookiesEnabled = true;
phantom.javascriptEnabled = true;

phantom.onError = function (msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function (t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

page.onConsoleMessage = function (msg, lineNum, sourceId) {
  console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

//const login = new Promise((resolve, reject) => {
page.open("https://facebook.com", function (status) {

  if (status !== 'success') {
    console.log('page open failed!');
    phantom.exit();
    //reject('page open failed!');
  }
  page.evaluate(function (config) {
    console.log('hello');
    document.querySelector("input[name='email']").value = config.facebook.login;
    document.querySelector("input[name='pass']").value = config.facebook.password;
    document.querySelector("#login_form").submit();
    // page is redirecting.
  }, config);
  setTimeout(function () {
    page.evaluate(function () {
      console.log('login page evaluated');
      // resolve();
    });
    page.render("page-logged-in.png");
    doSearch();
    //phantom.exit();
  }, 5000);

});

function doSearch() {

  page.onLoadFinished = function () {
    console.log('page load finished');
    page.render('page-search.png');
    fs.write('page.html', page.content, 'w');
    phantom.exit();
  };
  page.open(config.facebook.searchString, function (status2) {

    if (status2 !== 'success') {
      console.log('search page open failed!');
      phantom.exit();
    }


    page.evaluate(function () {
      console.log('search page evaluated');
    });
  });
}
