Facebook search via PhantomJS
-----------------------------
This was just a funny experiment for me to play with PhantomJS which is damn cool.

Please check facebook 
[automated data collection terms](https://www.facebook.com/apps/site_scraping_tos_terms.php)
before doing anything.
 
This repository contains two complimentary pieces of code:

* `searchUsers.js` - Auth to facebook via login form, make search query
 and parse user data - all while making screenshots of pages for debug purposes.
* `index.js` - simple telegram bot which takes authorisation and search commands, and forwards search output to user.

Please note that this will only work if you set english as your language in account preferences.

For starting bot, just create `config/config.json` with the following JSON 
(please fill with your own cridentials):

```javascript
{
  "facebook": {
    "login": "my@email.com",
    "password": "coolPassword"
  },
  "telegram": {
    "token": "123:AAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  }
}
```
And then run `npm start`.