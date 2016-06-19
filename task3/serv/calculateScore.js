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
      resolve(allWeight / allCount);
    }.bind(this));
  })
};