'use strict';

const path = require('path');
const views = require('co-views');
const redis = require('promise-redis')();

const rootKey = 'line_intern_task';
const render = views(path.join(__dirname, 'views'), {
  map: { html: 'jade' },
});
const client = redis.createClient(6379, 'localhost');
// Change to main DB
client.select(1);

const api = {
  getSupervise: function *(next) {
    const users = yield client.sdiff(`${rootKey}:analyzed_users`, `${rootKey}:supervised_users`);

    let userId = null;
    if (users.length >= 1) {
      userId = +users[Math.floor(Math.random() * users.length)];
    }
    else {
      // supervised_users is full
      yield client.del(`${rootKey}:supervised_users`);
      const analyzedUsers = yield client.smembers(`${rootKey}:analyzed_users`);
      userId = +analyzedUsers[Math.floor(Math.random() * analyzedUsers.length)]
    }

    if (userId) {
      yield client.sadd(`${rootKey}:supervised_users`, userId);
      this.body = {
        error: false,
        userId: userId,
        sampleTweetURL: yield client.get(`${rootKey}:user:${userId}:sample_tweet`),
      };
    }
    else {
      this.status = 500;
      this.body = { error: true };
    }
  },

  postSupervise: function *(next) {
    const userId = +this.query.userId;
    const score = +this.query.score;
    if (userId <= 0 || (score >= 1 && this.query.score !== '1') || (score <= 0 && this.query.score !== '0')) {
      this.status = 400;
      this.body = { error: true };
      return yield next;
    }
    const userWordList = yield client.get(`${rootKey}:user:${userId}:word`);
    if (!userWordList) {
      this.status = 500;
      this.body = { error: true };
      return yield next;
    }
    const userWordDict = {};
    userWordList.split('\t').filter((s) => s !== '').forEach((word) => {
      if (!(word in userWordDict)) {
        userWordDict[word] = 0;
      }
      userWordDict[word] = 1;
    });
    for (let word in userWordDict) {
      const wordCount = userWordDict[word];
      const weight = yield client.get(`${rootKey}:weighted_word:${word}:weight`);
      const count = yield client.get(`${rootKey}:weighted_word:${word}:count`);

      if (weight === null || count === null) {
        yield client.set(`${rootKey}:weighted_word:${word}:weight`, score);
        yield client.set(`${rootKey}:weighted_word:${word}:count`, wordCount);
      }
      else {
        yield client.set(`${rootKey}:weighted_word:${word}:weight`, (score * wordCount + weight * count) / (wordCount + count));
        yield client.incrby(`${rootKey}:weighted_word:${word}:count`, wordCount);
      }
      yield client.sadd(`${rootKey}:weighted_words`, word);
    }
    this.body = { error: false };
  },
};

module.exports = {
  index: function *(next) {
    this.body = yield render('index.jade');
  },
  supervise: function *(next) {
    this.body = yield render('supervise.jade');
  },
  api: api,
};

