'use strict';

const co = require('co');
const _ = require('lodash');
const MeCab = require('mecab-async');

const neologdPath = '/usr/local/lib/mecab/dic/mecab-ipadic-neologd';

const mecab = new MeCab();
MeCab.command = `mecab -d ${neologdPath}`;

module.exports = function(statuses, dbClient, rootKey) {
  return new Promise((resolve, reject) => {
    co(function* () {
      const nestedWords = statuses
        .filter((status) => !status.retweeted_status)
        .map((status) => status.text)
        .map((text) =>  {
          return mecab.parseSync(text)
            .map((a) => a[7])               // originalForm
            .filter((w) => w !== '*' && w !== 'HTTPS');   // Exclude common word
        });
      const userWordDict = {};
      _.flatten(nestedWords).forEach((word) => {
        if (!(word in userWordDict)) {
          userWordDict[word] = 0;
        }
        userWordDict[word] += 1;
      });

      let allWeight = 0;
      let allCount = 0;
      for (let word in userWordDict) {
        const weight = yield dbClient.get(`${rootKey}:weighted_word:${word}:weight`);
        if (weight !== null) {
          allWeight += (+weight) * userWordDict[word];
          allCount += userWordDict[word];
        }
      }
      if (allCount === 0) {
        reject();
      }

      resolve(cdf(((allWeight / allCount) - 0.5) * 8));
    }.bind(this));
  })
};

// CDF of the normal distribution
// http://qiita.com/gigamori/items/e17e6f9faffb78822c56
function cdf(x) {

  // constants
  var p  =  0.2316419;
  var b1 =  0.31938153;
  var b2 = -0.356563782;
  var b3 =  1.781477937;
  var b4 = -1.821255978;
  var b5 =  1.330274429;

  var t = 1 / (1 + p * Math.abs(x));
  var Z = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  var y = 1 - Z * ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;

  return (x > 0) ? y : 1 - y;
}
