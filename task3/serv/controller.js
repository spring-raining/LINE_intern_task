'use strict';

const path = require('path');
const views = require('co-views');

const render = views(path.join(__dirname, 'views'), {
  map: { html: 'jade' },
});

module.exports = {
  index: index,
  supervise: supervise,
};

function* index(next) {
  this.body = yield render('index.jade');
}

function* supervise(next) {
  this.body = yield render('supervise.jade');
}

