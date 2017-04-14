'use strict';

const _ = require('lodash'),
  log = require('amphora').log.withStandardPrefix(__filename),
  request = require('limit-request-promise'),
  // throttle requests - 1000/60s
  lp = new request(1,1);

let page = (url) => {
  let options = {
    url: url,
    simple: false
  };

  return lp.req(options)
    .then(json => JSON.parse(json))
    .catch(logError)
    .map(uri => {
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
              headLayoutData = _.get(results, 'headLayout', {}),
              primaryHeadData = _.get(results, 'head', {}),
              headData,
              filteredHeadData,
              allHeadData,
              allArticleData;

              headData = _.map(headLayoutData, item => _.pick(item, headFields));
              filteredHeadData = headData.filter(value => Object.keys(value).length !== 0);
              allHeadData = filteredHeadData.reduce(function(data, item) {
                let keys = Object.keys(item),
                  x = keys[0],
                  y = keys[1];
                data[x] = item[x];
                if (y) {
                  data[y] = item[y];
                }
                return data;
              },{});

              Object.assign(articlesData, mainData, splashHeaderData);
              allArticleData = _.pick(articlesData, articleFields);

            // assign all article data and head data to obj
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

            return obj;
          })
          .catch(logError)
      return uri;
    });
    .catch(logError)
  }

/**
 * Resolve object values, e.g. [{text:tag}{text:tag}] becomes [tag, tag]
 * @param {[{}]} items
 * @returns {Array}
 */
function resolveObj(items) {
  return items.reduce((arr, item) => arr.concat(item.text), []);
}

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

module.exports.page = page;

