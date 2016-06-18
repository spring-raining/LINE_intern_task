'use strict';

module.exports = {
  index: index,
  analysis: analysis,
};

function* index(next) {
  this.body = 'Hello world'
}

function* analysis(next) {
  if (this.method !== 'POST') {
    return yield next;
  }

  console.log(this.query);

  this.body = {
    status: 'ok',
  };
}

