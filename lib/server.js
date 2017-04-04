'use strict';

const _ = require('lodash'),
  log = require('amphora').log.withStandardPrefix(__filename),
  request = require('request-promise'),
  bluebird = require('bluebird'),
  fs = require('graceful-fs'),
  path = require('path'),
  file = path.join(__dirname, '../data/data.json'),
  // Add more pages eventually
  sites = ['daily/intelligencer',
  'scienceofus',
  'thecut',
  'betamale',
  'thejob',
  'strategist',
  'nyxny',
  'vindicated',
  'speed',
  'selectall',
  'bestofny'
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

/**
 * Resolve object values, e.g. [{text:tag}{text:tag}] becomes [tag, tag]
 * @param [{object}] items 
 * @returns Array
 */
function resolveObj(items) {
  const arr = [];
  items.forEach(function(item) {
    return arr.push(item.text);
  });
  return arr;
}

const pages = sites.map(site => {
  let options = {
    url: `http://nymag.com/${site}/pages`,
    simple: false
  };

  return request.get(options)
  .then(json => JSON.parse(json))
  .then(data => {
    data.forEach(function (uri) {
      let obj = {},
        options = {
          url: `http://${uri}@published`,
          simple: false
        };

      return request.get(options)
      .then(json => JSON.parse(json))
      .then(data => {
        let options = {
          url: `http://${data.main[0]}.json`,
          simple: false
        };

        return request.get(options)
        .then(json => JSON.parse(json))
        //.tap(console.log)
        .then(data => {
          obj = _.pick(data, ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'featureTypes', 'tags', 'contentChannel', 'authors']);
          obj.pageUri = uri;
          obj.authors = resolveObj(obj.authors) || '';
          obj.tags = resolveObj(obj.tags.items) || '';
          obj.featureTypes = _.keys(_.pickBy(obj.featureTypes));
          obj.cmsSource = 'Clay';
          obj.domain = 'nymag.com';
          obj.vertical = site;

          return obj;

        })
        .catch(logError)
      })
      // write to a file for now for uploading to big query
      // TODO: directly import dataset to big query
      .then(data => {
        fs.appendFile(file, JSON.stringify(obj) + 
          '\n')
      })
      .catch(logError)
    })
    return data;
  })
  //.tap(console.log)
  .catch(logError)
});


Promise.all(pages)
.then(results => {
  console.log('these are our uri results', results);
  return results;
})

