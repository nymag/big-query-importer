'use strict';

const _ = require('lodash'),
  log = require('amphora').log.withStandardPrefix(__filename),
  request = require('request-promise'),
  fs = require('fs'),
  pagesPath = 'pages',
  http = 'http://',
  published = '@published',
  // Add more pages eventually
  pages = [
    'http://nymag.com/thejob/',
    'http://nymag.com/betamale/'
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


function resolveArticleUri(uri) {
  let options = {uri: http + uri, simple: false};
  return request(options)
    .then(JSON.parse)
    .spread(function (data) {
      return _.pick(data, ['date', 'canonicalUrl', 'domain', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'featureTypes', 'tags', 'contentChannel', 'authors'])
    })
}


//console.log(resolveArticleUri('nymag.com/thejob/pages/cj002r9ve003wk2y62l7gmiqi@published'))

function getPublishedPageUris(uris) {
  uris.forEach(function (uri) {
    //console.log('what is uri', uri);
    let re = uri.match(/^nymag.com\/\w*\/pages\/c\w*/),
      publishedUri = http + re + published,
      options = {uri: publishedUri, simple: false};

    request(options)
      .then(JSON.parse)
      .then(function (data) {
        data.pageUri = options.uri
        data.article = resolveArticleUri(data.main[0])
        return data;
      })
      //fs.appendFile('/data/test.json', JSON.stringify(data))
  })
}

function getPageData() {
  pages.forEach(function (pageUri) {

    request(pageUri + pagesPath)
      .then(JSON.parse)
      .then(data => getPublishedPageUris(data))
      .catch(logError);
  });

}

module.exports = getPageData;
