'use strict';

const bluebird = require('bluebird'),
  request = require('request'),
  transform = require('../modules/page/transform.js'), // wrapped so that it can be stubbed
  protocol = 'http://',
  _ = require('highland'),
  publishedVersion = '@published',
  jsonExtension = '.json',
  urls = require('url'),
  oboe = require('oboe-promise');
/*  fs = require('fs'),
  util = require('util'),
  log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'}),
  log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};
*/

function fetchSingleInstance(url, transform) {
  const stream = ((push) => {
      oboe({
          url: url
      })
      .node('*!', (data) => {
          push(null, data);
          // drop the response!
          return oboe.drop;
      })
      .run()
      .then(transform.bind(null, url))
      .then((response) => {
        //console.log('what is response', response);
        push(null, response);

        return oboe.drop;
      })
      .catch((reason) => {
        console.log('STREAM FAILURE', reason);
        push(null, _.nil);
      })
  });
return bluebird.resolve(
  _(stream)
  .each((head) => {
    console.log('this is the head', head);
    return head;
  })
)
}

function fetchListInstances(url, head, start, end) {
  return bluebird.resolve( 
    _(request(url))
    .collect()
    .map(Buffer.concat)
    .flatMap(x => JSON.parse(x.toString('utf-8')))
    .compact()
    .slice(start, end)
    .ratelimit(2, 100)
    .each(url => module.exports.fetchSingleInstance('http://' + url + jsonExtension, head))
    .done(data => console.log('Done!')) 
  )    
}

module.exports.fetchSingleInstance = fetchSingleInstance;
module.exports.fetchListInstances = fetchListInstances;