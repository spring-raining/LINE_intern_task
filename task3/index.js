'use strict';

const koa = require('koa');
const logger = require('koa-logger');
const route = require('koa-route');

const ctrl = require('./src/controller');

const app = koa();
app.use(logger());

app.use(route.get('/', ctrl.index));
app.use(route.post('/analysis', ctrl.analysis));

if (!module.parent) {
  app.listen(3000);
}

