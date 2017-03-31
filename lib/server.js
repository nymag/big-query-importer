'use strict';

const _ = require('lodash'),
  log = require('amphora').log.withStandardPrefix(__filename),
  request = require('request-promise'),
  bluebird = require('bluebird'),
  fs = require('fs'),
  pagesPath = 'pages',
  http = 'http://',
  published = '@published',
  // Add more pages eventually
  sites = [
    'thejob',
    'betamale'
  ];
/**
 * log error, do not throw
 * @param {object} data
 * @returns {Function}
 */
function logError(data) {
  return function (err) {
    log('error', err);
    return data;
  };
}

const pages = sites.map(site => {
  const options = {
    url: `http://nymag.com/${site}/pages`,
    simple: false
  };

  return request.get(options)
  .then(body => JSON.parse(body))
  .then(uris => {
    uris.forEach(function (uri) {
      const options = {
        url: `http://${uri}@published`,
        simple: false
      };

      return request.get(options)
      .then(body => JSON.parse(body))
      .then(data => {
        data.pageUri = uri;
        return data;
      })
      .tap(console.log)
      return uris;
    })
  })
  .catch(logError)
});


Promise.all(pages)
.then(results => {
  console.log('results',results);
})

