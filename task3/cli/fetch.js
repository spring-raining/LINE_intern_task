'use strict';

import jsonp from 'jsonp';

function buildURI(url, args) {
  let uri = url;
  if (args) {
    uri += '?' + Object.keys(args)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(args[key])}`)
        .join('&');
  }
  return uri;
}

export default function (method, url, args = null, isJsonp = false) {
  return new Promise((resolve, reject) => {
    if (isJsonp) {
      jsonp(buildURI(url, args), {}, (err, data) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    }
    else {
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
      xhr.send();
    }
  });
}
