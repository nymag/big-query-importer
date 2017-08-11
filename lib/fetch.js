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
  oboe = require('oboe');


/**
 * log error, do not throw
 * @param {object} data
 * @returns {Function}
 */
function logSwallowedError(data) {
  return function (err) {
    log('error', err);
    return data;
  };
}

/**
 * ensure we have protocol and @published.json
 * @param {string} str
 * @returns {string}
 */
function ensurePublishedJsonUrl(str) {
  return (str.substr(0, 7).toLowerCase() === protocol ? '' : protocol) +
    str +
    (str.substr(-10) === publishedVersion ? '' : publishedVersion) +
    jsonExtension;
}

/**
 * keep the `@published` in the uri
 * @param {string} url
 * @returns {string}
 */
function urlToUri(url) {
  return url.substr(protocol.length).split(jsonExtension)[0];
}

/**
 * the header status is 200 and the 404 message is in the json
 * @param {object} [json]
 * @returns {*}
 */
function throwOn404Json(json) {
  const code = _get(json, 'code');

  if (code && code > 200) {
    throw new Error(code.toString());
  } else {
    return json;
  }
}

/**
 * fetch json for a single composed instance
 * @param {string} url e.g. `http://types.nymag.sites.aws.nymetro.com/selectall/pages/an-instance`
 * @param {Function} transform js module that takes json and transforms it to bq fields
 * @returns {Promise} resolves to an object
 */
function fetchInstance(url, transform) {
  // Throttle requests - 1000/60s
  let lp = throttle.requestPromiseRetry(throttle.requestPromise),
    publishedUrl = ensurePublishedJsonUrl(url),
    publishedUrlHostName = urls.parse(publishedUrl).hostname,
    publishedUrlPath = urls.parse(publishedUrl).path,
    bigBoxUrl = publishedUrlHostName.replace(publishedUrlHostName, '172.24.17.157'),
    publish = `http://${bigBoxUrl}${publishedUrlPath}`;
    // publishedUri = urlToUri(publishedUrl);
    console.log('publishedUrl', publish);
    console.log('publishedUrl', publishedUrl);
    console.log('publishedUrlpath', publishedUrlPath);
    console.log('publishedUrl', bigBoxUrl);
  return bluebird.resolve(
    lp({
        url: publish,
        method: 'GET',
        headers: {
          'Host': 'nymag.com',
          'X-forwarded-host': 'nymag.com'
        }
      })
    )
    .then(json => JSON.parse(json))
    .catch(err => console.log.bind(console))
    .then(throwOn404Json)
    .then(transform.bind(null, publish))
    .then(result => {
      return result;
    })
    .catch(logSwallowedError(null));
}


function fetchSingleInstance(url) {
  const stream = _((push) => {
      oboe({
          url: url,
          method: 'GET'
      }).node('{head}', (data) => {
          push(null, data);
          return oboe.drop;
      }).done((response) => {
          // without drop, the entire response would now be stored here       
          push(null, _.nil);
      }).fail((reason) => {
          console.error('failed',reason);
          push(null, _.nil);
      });
  });

  stream.each((head) => {
    console.log('this is the head', head);
    return transform.toBigQuery(url, head);
  });
}

/*function fetchListInstances(url, transform) {
hl(request(url))
  .collect()
  .map(Buffer.concat)
  .flatMap(x => JSON.parse(x.toString('utf8')))
  .each(user => console.log(user.id))
  .done(data => console.log('DONE'));
}
*/

function fetchListInstances(url) {
  return Promise.resolve(
    _(request(url))
      .collect()
      .map(Buffer.concat)
      .flatMap(x => JSON.parse(x.toString('utf-8')))
      .slice(0, 10)
      .throttle(2000)
      .tap(console.log)
      .each(url => module.exports.fetchSingleInstance(protocol + url + jsonExtension))
      .done(data => console.log('Done!'))
  )      
}

module.exports.fetchInstance = fetchInstance;
module.exports.fetchSingleInstance = fetchSingleInstance;
module.exports.fetchListInstances = fetchListInstances;