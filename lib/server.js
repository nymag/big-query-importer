'use strict';

const _ = require('lodash'),
  log = require('amphora').log.withStandardPrefix(__filename),
  request = require('request-promise'),
  bluebird = require('bluebird'),
  fs = require('fs'),
  // Add more pages eventually
  sites = [
    'strategist'
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

function getNormalizedAuthors(authors) {
  const arr = [];
  authors.forEach(function(author) {
    return arr.push(author.text);
  });
  return arr;
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
      let obj = {},
      options = {
        url: `http://${uri}@published`,
        simple: false
      };

      return request.get(options)
      .then(body => JSON.parse(body))
      .then(data => {
        let options = {
          url: `http://${data.main[0]}.json`,
          simple: false
        };

        return request.get(options)
        .then(body => JSON.parse(body))
        .then(data => {
          obj = _.pick(data, ['date', 'canonicalUrl', 'domain', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'featureTypes', 'tags', 'contentChannel', 'authors']);
          obj.pageUri = uri;
          if (obj.authors) {
            obj.authors = getNormalizedAuthors(obj.authors)
          }

          return obj;
        })
        .tap(console.log)
      })
    })
    return obj;
  })
  //.tap(console.log)
  .catch(logError)
});


Promise.all(pages)
.then(results => {
  console.log('results',results);
})

