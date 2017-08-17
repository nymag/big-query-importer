'use strict';

const _ = require('highland'),
  request = require('request'),
  transform = require('../modules/page/transform.js'),
  jsonExtension = '.json',
  protocol = 'http://',
  oboe = require('oboe');


function fetchSingleInstance(url, dataset, table, schema) {
  const stream = _((push) => {
      oboe({
          url: url
      }).node('*!', (data) => {
          push(null, data);
          // drop the response!

          return oboe.drop;
      }).done((response) => {
          push(null, _.nil);
      }).fail((reason) => {
          console.log('Reason:', reason);
          push(null, _.nil);
      });
  });

  stream.each((results) => {
    return transform.toBigQuery(url, results, dataset, table, schema);
  });
}

function fetchListInstances(url, dataset, table, schema, start, end) {
  let ops = {
    url: url,
  };
  return _(request(ops))
    .collect()
    .map(Buffer.concat)
    .flatMap(x => JSON.parse(x.toString('utf-8')))
    .compact()
    .slice(start, end)
    .ratelimit(1, 1000)
    .each(url => module.exports.fetchSingleInstance(protocol + url + jsonExtension, dataset, table, schema))
    .done(data => console.log('Done!'))     
}

module.exports.fetchSingleInstance = fetchSingleInstance;
module.exports.fetchListInstances = fetchListInstances;