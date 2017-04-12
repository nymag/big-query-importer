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
              let articleFields = ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'syndicatedUrl', 'featureTypes', 'tags', 'contentChannel', 'authors', 'rubric'],
                headFields = ['clayType', 'twitterTitle', 'siteName', 'ogTitle'],
                articlesData = {},
                mainData = _.get(results, 'main[0]', {}),
                splashHeaderData = _.get(results, 'splashHeader[0]', {}),
                headLayoutData = _.get(results, 'headLayout[0]', {}),
                primaryHeadData = _.get(results, 'head[0]', {}),
                headData = {},
                allHeadData,
                allArticleData;

                Object.assign(headData, headLayoutData, primaryHeadData);
                allHeadData = _.pick(headData, headFields);

                Object.assign(articlesData, mainData, splashHeaderData);
                allArticleData = _.pick(articlesData, articleFields);

              // assign all article data, and head data to obj
              Object.assign(obj, allArticleData, allHeadData);
              obj.pageUri = uri;
              obj.cmsSource = 'clay';
              if (obj.authors) {
                obj.authors = resolveObj(obj.authors);
              }
              if (obj.tags) {
                obj.tags = resolveObj(obj.tags.items);
              }
              obj.featureTypes = _.keys(_.pickBy(obj.featureTypes));
              obj.domain = 'nymag.com';

              // write objects to a file to upload to Big Query
              // TODO: connect to BQ's API directly
              fs.appendFile(file, JSON.stringify(obj) + '\n');
            })
          .catch(logError)
        });
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
