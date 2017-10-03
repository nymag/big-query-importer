'use strict';

const bluebird = require('bluebird'),
  _get = require('lodash/get'),
  _compact = require('lodash/compact'),
  request = require('request'),
  _take = require('lodash/take'),
  log = require('amphora').log.withStandardPrefix(__filename),
  throttle = require('./throttle'), // wrapped so that it can be stubbed
  transform = require('../modules/page/transform.js'), // wrapped so that it can be stubbed
  protocol = 'http://',
  _ = require('highland'),
  publishedVersion = '@published',
  jsonExtension = '.json',
  urls = require('url'),
  StreamArray = require('stream-json/utils/StreamArray'),
  stream = StreamArray.make(),
  oboe = require('oboe'),
  fs = require('fs'),
  util = require('util'),
  log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'}),
  log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};


function fetchSingleInstance(url) {
  const stream = _((push) => {
      oboe({
          url: url,
          method: 'GET',
          headers: {
            'Host': 'nymag.com',
            'X-forwarded-host': 'nymag.com'
          }
      }).node('*!', (data) => {
          push(null, data);
          // drop the response!
          return oboe.drop;
      }).done((response) => {
          push(null, _.nil);
      }).fail((reason) => {
          console.log('STREAM FAILURE');
          console.log(url)
          console.log(reason);
          push(null, _.nil);
      });
  });

  stream.each((head) => {
    // console.log('this is the head', head);
    return transform.toBigQuery(url, head);
  });
}

function fetchListInstances(url) {
  let ops = {
    url: url,
    headers: {
      'Host': 'nymag.com',
      'X-forwarded-host': 'nymag.com'
    }
  };
  return _(request(ops))
    .collect()
    .map(Buffer.concat)
    .flatMap(x => JSON.parse(x.toString('utf-8')))
    .compact()
    .ratelimit(1, 100)
    .each(url => module.exports.fetchSingleInstance('http://' + url.replace('nymag.com', '172.24.17.157') + jsonExtension))
    .done(data => console.log('Done!'))     
}

module.exports.fetchSingleInstance = fetchSingleInstance;
module.exports.fetchListInstances = fetchListInstances;