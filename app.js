'use strict'
const express = require('express'),
  app = express(),
  lib = require('./lib/server'),
  port = process.env.PORT || 9000,
  bodyParser = require('body-parser'),
  ip = process.env.IP_ADDRESS || '127.0.0.1';

app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));

app.listen(port, ip, (err) => {
  if (err) {
    return console.log('Error', err);
  } else {
    console.log(`Server listening on ${ip}:${port}`);
    lib();
  }
});

