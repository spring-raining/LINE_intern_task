'use strict';

const co = require('co');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

function buildURI(url, args) {
  let uri = url;
  if (args) {
    uri += '?' + Object.keys(args)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(args[key])}`)
        .join('&');
  }
  return uri;
}

function fetch(method, url, args, requestHeaders, requestBody) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      }
      else {
        reject(JSON.parse(xhr.responseText));
      }
    };
    xhr.onerror = () => {
      reject(xhr.statusText);
    };
    xhr.open(method, buildURI(url, args));

    if (requestHeaders) {
      Object.keys(requestHeaders).forEach((key) => {
        xhr.setRequestHeader(key, requestHeaders[key]);
      });
    }
    xhr.send(requestBody);
  });
}

class Twitter {
  constructor(consumerKey, consumerSecret) {
    co(function *() {
      this.consumerKey = consumerKey;
      this.consumerSecret = consumerSecret;
      this.bearerToken = yield function *() {
        const auth = `Basic ${new Buffer(this.consumerKey + ':' + this.consumerSecret).toString('base64')}`;
        const result = yield fetch('POST', 'https://api.twitter.com/oauth2/token', null,
          {
            'Authorization': auth,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          }, 'grant_type=client_credentials');

        if (result['access_token']) {
          return result['access_token'];
        }
      }.bind(this)();

      this.userTimeline = function *(screenName) {
        return yield fetch('GET', 'https://api.twitter.com/1.1/statuses/user_timeline.json',
          {
            'screen_name': screenName,
            count: 200,
          }, {
            'Authorization': `Bearer ${this.bearerToken}`
          }, null);
      }.bind(this);
    }.bind(this));
  }
}

module.exports = Twitter;
