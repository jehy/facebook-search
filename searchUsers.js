/* eslint-env node, phantomjs, browser */
/* eslint-disable prefer-arrow-callback, prefer-template */

const phantom = require('phantom'),
  config = require('./config/config.json'),
  fs = require('fs-extra'),
  Promise = require('bluebird'),
  uuid = require('uuid/v4');

function searchUsers(searchQuery) {
  if (searchQuery.indexOf('https://www.facebook.com/search/str') !== 0) {
    return Promise.reject('Wrong search query!');
  }
  const
    requestUuid = uuid();

  function getFileName(fileName) {
    return fileName.split('.').join(`.${requestUuid}.`);
  }

  let instance,
    page;
  const replyData = {files: [], images: [], text: ''};

  function auth() {
    return fs.readJson('tmp/cookies.json')
      .then((data) => {
        console.log('found saved cookies');
        data.forEach((cookie) => {
          page.addCookie(cookie);
        });
      })
      .catch((e) => {
        console.log('no coookie available, trying to auth');
        return page.open('https://www.facebook.com')
          .then((data) => {
            // status = data;
            return page.property('content');
          })
          .then((data) => {
            // content = data;
            const file = getFileName('tmp/main-page.png');
            replyData.images.push(file);
            return page.render(file);
          })
          .then(() => {
            return page.evaluate(function (thisConfig) {
              document.querySelector("input[name='email']").value = thisConfig.facebook.login;
              document.querySelector("input[name='pass']").value = thisConfig.facebook.password;
              document.querySelector('#login_form').submit();
            }, config);
          })
          .then(() => {
            return Promise.delay(5000);
          })
          .then((data) => {
            const file = getFileName('tmp/logged-in-page.png');
            replyData.images.push(file);
            return page.render(file);
          })
          .then(() => {
            return page.property('cookies')
              .then((data) => {
                if (data) {
                  return fs.writeJson('tmp/cookies.json', data);
                }
                return null;
              });
          });
      });
  }

  return phantom.create()
    .then((data) => {
      instance = data;
      return instance.createPage();
    })
    .then((data) => {
      page = data;
      const init = [
        fs.ensureDir('tmp'),
        page.property('viewportSize', {width: 1024, height: 768}),
        page.setting('javascriptEnabled', true),
        page.setting('cookiesEnabled', true),
        page.setting('userAgent', 'Mozilla/5.0 (Windows NT 6.1; ru-ru)' +
          ' AppleWebKit/537.17 (KHTML, like Gecko) Chrome/24.0.1312.57 Safari/537.17')];
      return Promise.all(init);
    })
    .then(() => {
      return auth();
    })
    .then(() => {
      return page.property('viewportSize', {width: 1024, height: 60000});
    })
    .then(() => {
      return page.open(searchQuery);
    })
    .then(() => {
      function checkIfLoaded() {
        return Promise.resolve()
          .then(() => page.property('content'))
          .then((content) => {
            const count = content.match(/End of Results/gi);
            if (count === null) {
              console.log('page still loading...');
              return Promise.delay(300).then(() => {
                return checkIfLoaded();
              });
            }
            return null;
          });
      }

      return checkIfLoaded().timeout(60000);
    })
    .then(() => {
      const file = getFileName('tmp/search-page.png');
      replyData.images.push(file);
      return page.render(file);
    })
    .then(() => {
      return page.property('content');
    })
    .then((data) => {
      const file = getFileName('tmp/search-page.html');
      return fs.outputFile(file, data);
    })
    .then(() => {
      return page.evaluate(function (pagePromise) {
        var users = [];
        var workLocationStudy;
        var i, n, locLink, splitName;
        // var people = document.querySelectorAll('div._42ef');
        var people = document.querySelectorAll('div._glj');
        for (i = 0; i < people.length; i++) {
          users[i] = {};
          users[i].name = people[i].querySelector('div._32mo').innerHTML;
          splitName = users[i].name.split(' ');
          if (splitName.length > 1) {
            users[i].name = splitName[0];
            users[i].lastName = splitName[1];
          }
          workLocationStudy = people[i].querySelectorAll('div._52eh');
          for (n = 0; n < workLocationStudy.length; n++) {
            if (workLocationStudy[n].innerHTML.indexOf('Lives') !== -1) {
              locLink = workLocationStudy[n].querySelector('a');
              if (locLink && locLink.innerHTML) {
                users[i].from = locLink.innerHTML;
              }
            }
          }
        }
        return users;
      }, Promise);
    })
    .then((users) => {

      const csvData = users.map((user) => {
        const tmp = user;
        tmp.from = user.from || '';
        tmp.lastName = user.lastName || '';
        return `${tmp.name};${tmp.lastName};${tmp.from}`;
      }).join('\n');
      console.log(users);
      const file = getFileName('tmp/users.csv');
      replyData.files.push(file);
      fs.writeFile(file, csvData);
    })
    .then(() => {
      replyData.text = 'All ok!';
      instance.exit();
      console.log(replyData);
      return replyData;
    })
    .catch((e) => {
      console.log(`Huston, we have a problem: ${e.toString()}`);
      replyData.text = e.toString();
      instance.exit();
      return replyData;
    });
}

// searchUsers(config.facebook.searchString);
module.exports = searchUsers;
