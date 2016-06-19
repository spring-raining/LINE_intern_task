'use strict';

const co = require('co');
const redis = require('promise-redis')();
const client = redis.createClient(6379, 'localhost');
client.select(1);

co(function *() {
  const words = yield client.smembers('line_intern_task:weighted_words')
  for (let word of words) {
    yield client.del(`line_intern_task:weighted_word:${word}:weight`);
    yield client.del(`line_intern_task:weighted_word:${word}:count`);
    console.log(word);
  }
  client.del(`line_intern_task:weighted_words`);
  return;
});
