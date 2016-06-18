'use strict';

const path = require('path');
const koa = require('koa');
const logger = require('koa-logger');
const route = require('koa-route');
const serve = require('koa-static');

const ctrl = require('./serv/controller');

const app = koa();
app.use(logger());

app.use(route.get('/', ctrl.index));
app.use(route.get('/supervise', ctrl.supervise));

// static files
app.use(serve(path.join(__dirname, 'dist')));

if (!module.parent) {
  app.listen(3000);
}

