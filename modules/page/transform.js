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
  // console.log('what is instanceJson', instanceJson)
  let pageData = {},
    articleFields = ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'syndicatedUrl', 'featureTypes', 'tags', 'contentChannel', 'authors', 'rubric', 'magazineIssueDate'],
    headFields = ['twitterTitle', 'ogTitle', 'syndicatedUrl'],
    headLayoutFields = ['siteName', 'pageType', 'vertical'],
    getMainArticleData = _.pick(_.get(instanceJson, 'main[0]', {}), articleFields),
    getSplashHeaderData = _.get(instanceJson, 'splashHeader[0]', {}),
    getHeadLayoutData = _.get(instanceJson, 'headLayout', {}),
    getHeadData = _.get(instanceJson, 'head', {}),
    headData,
    headLayoutData,
    filteredHeadData,
    filteredHeadLayoutData;

  headData = _.map(getHeadData, item => _.pick(item, headFields));
  filteredHeadData = headData.filter(value => Object.keys(value).length !== 0);
  headLayoutData = _.map(getHeadLayoutData, item => _.pick(item, headLayoutFields));
  filteredHeadLayoutData = headLayoutData.filter(value => Object.keys(value).length !== 0);

  // Assign headData, headLayoutData, splashHeaderData, and mainData to the articlesData obj
  Object.assign(pageData, filteredHeadData[0], filteredHeadLayoutData[0], getSplashHeaderData, getMainArticleData);

  pageData.pageUri = 'http://' + instanceUri;
  pageData.cmsSource = 'clay';
  if (pageData.authors) {
    pageData.authors = resolveObj(pageData.authors);
  }
  if (pageData.tags) {
    pageData.tags = resolveObj(pageData.tags.items);
  }
  pageData.featureTypes = _.keys(_.pickBy(pageData.featureTypes));
  pageData.domain = 'nymag.com';

  console.log('what is our page data', pageData);
  return pageData;
}

module.exports.toBigQuery = articleToBigQuery;
