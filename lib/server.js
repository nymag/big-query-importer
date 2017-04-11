'use strict';

const _ = require('lodash'),
  log = require('amphora').log.withStandardPrefix(__filename),
  request = require('limit-request-promise'),
  // throttle requests - 1000/60s
  lp = new request(1,1),
  fs = require('graceful-fs'),
  path = require('path'),
  file = path.join(__dirname, '../data/data.json'),
  // Add more sites eventually
  //sites = [''];
  sites = ['betamale', 'nyxny', 'thecut', 'selectall', 'strategist', 'daily/intelligencer', 'vindicated', 'thejob', 'bestofny', 'scienceofus'],
  pages = sites.map(site => {
    let options = {
      url: `http://types.nymag.sites.aws.nymetro.com/${site}/pages`,
      simple: false
    };

    return lp.req(options)
      .then(json => JSON.parse(json))
      .catch(logError)
      .then(data => {
        data.forEach(function (uri) {
          let obj = {},
            options = {
              url: `http://${uri}@published.json`,
              simple: false
            };

          return lp.req(options)
            .then(json => JSON.parse(json))
            .then(results => {
              let articleData = _.pick(results.main[0], ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'syndicatedUrl', 'featureTypes', 'tags', 'contentChannel', 'authors', 'rubric', 'cmsSource']),
                headLayoutData = results.headLayout.filter(item => item.clayType),
                headData = results.head.filter(item => item.twitterTitle);

              Object.assign(obj, articleData);
              obj.pageUri = uri;
              obj.clayType = headLayoutData[0].clayType;
              obj.vertical = headLayoutData[0].siteName;
              obj.facebookTitle = headData[0].ogTitle;
              obj.twitterTitle = headData[0].twitterTitle;
              if (obj.authors) {
                obj.authors = resolveObj(obj.authors);
              }
              if (obj.tags) {
                obj.tags = resolveObj(obj.tags.items);
              };
              obj.featureTypes = _.keys(_.pickBy(obj.featureTypes));
              obj.domain = 'nymag.com';

              // write objects to a file to upload to Big Query
              // TODO: connect to BQ's API directly
              fs.appendFile(file, JSON.stringify(obj) + '\n')
            })
            .catch(logError)
        })
        return data;
      })
      .catch(logError)
  });

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
 * @param {[{}]} items
 * @returns {Array}
 */
function resolveObj(items) {
  return items.reduce((arr, item) => arr.concat(item.text), []);
}

Promise.all(pages)
.then(results => {
  // console.log('these are our uri results', results);
  return results;
});
