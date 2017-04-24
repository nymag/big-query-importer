'use strict';

const _ = require('lodash');

/**
 * Resolve object values, e.g. [{text:tag}{text:tag}] becomes [tag, tag]
 * @param {[{}]} items
 * @returns {Array}
 */
function resolveObj(items) {
  return items.reduce((arr, item) => arr.concat(item.text), []);
}

/**
 * Mapping function instanceJson -> big query object
 * Business logic goes here
 * @param {string} instanceUri e.g. `some-site.com/pages/an-instance@published.json`
 * @param {object} instanceJson
 * @returns {object}
 */
function articleToBigQuery(instanceUri, instanceJson) {
  let articleFields = ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'syndicatedUrl', 'featureTypes', 'tags', 'contentChannel', 'authors', 'rubric'],
    headFields = ['clayType', 'twitterTitle', 'siteName', 'ogTitle'],
    articlesData = {},
    mainData = _.get(instanceJson, 'main[0]', {}),
    splashHeaderData = _.get(instanceJson, 'splashHeader[0]', {}),
    headLayoutData = _.get(instanceJson, 'headLayout', {}),
    // primaryHeadData = _.get(instanceJson, 'head', {}),
    headData,
    filteredHeadData,
    allHeadData,
    allArticleData,
    obj = {};

  headData = _.map(headLayoutData, item => _.pick(item, headFields));
  filteredHeadData = headData.filter(value => Object.keys(value).length !== 0);
  // clean this up..probably a better way to do it
  allHeadData = filteredHeadData.reduce(function (data, item) {
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

  // Assign all article data and head data to obj
  Object.assign(obj, allArticleData, allHeadData);
  obj.pageUri = instanceUri;
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
}

module.exports.toBigQuery = articleToBigQuery;
