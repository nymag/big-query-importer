'use strict';

const _ = require('lodash'),
  stripTags = require('striptags'),
  count = require('word-count'),
  product = '/components/product',
  bq = require('../../services/big-query.js'),
  schema = require('./schema.json'), // wrapped so that it can be stubbed
  urls = require('url');

/**
 * Resolve object values, e.g. [{text:tag}{text:tag}] becomes [tag, tag]
 * @param {[{}]} items
 * @returns {Array}
 */
function resolveObj(items) {
  if (items !== undefined) {
    return items.reduce((arr, item) => {
      if (item.description && item.description.length > 0) {
        // product components have description fields
        return arr.concat(item.text, item.description[0].text);
      } else { 
        return arr.concat(item.text);
      }
    }, []);
  }
}

/**
 * Resolve a specified object property within article content, e.g. [{ref:uri}{ref:uri}] becomes [uri, uri]
 * @param {[{}]} items
 * @returns {Array}
 */
function resolveObjProperty(items, property) {
  if (items !== undefined) {
    return items.reduce((arr, item) => arr.concat(item[property]), []);
  }
}

/**
 * Mapping function instanceJson -> big query object
 * Business logic goes here
 * @param {string} instanceUri e.g. `some-site.com/pages/an-instance@published.json`
 * @param {object} instanceJson
 * @returns {object}
 */
function articleToBigQuery(instanceUri, instanceJson) {
  //console.log('data passed to the transform', instanceJson);
  console.log(instanceUri);
  let pageData = {},
    instanceUriHost = 'http://' + instanceUri,
    articleFields = ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'syndicatedUrl', 'featureTypes', 'tags', 'contentChannel', 'authors', 'rubric', 'magazineIssueDate', 'content'],
    headFields = ['twitterTitle', 'ogTitle', 'syndicatedUrl'],
    headLayoutFields = ['siteName', 'pageType', 'vertical'],
    getMainArticleData = _.pick(_.get(instanceJson, 'main[0]', {}), articleFields),
    // getSplashHeaderData = _.get(instanceJson, 'splashHeader[0]', {}),
    getHeadLayoutData = _.get(instanceJson, 'headLayout', {}),
    getHeadData = _.get(instanceJson, 'head', {}),
    resolvedArticleContent,
    resolvedArticleRefs,
    resolvedArticleProductRefs,
    resolvedArticleProductBuyUrls,
    filteredArticleContent,
    totalWordsInArticleContent,
    headData,
    headLayoutData,
    filteredHeadData,
    filteredHeadLayoutData;

  headData = _.map(getHeadData, item => _.pick(item, headFields));
  filteredHeadData = _.compact(headData);
  headLayoutData = _.map(getHeadLayoutData, item => _.pick(item, headLayoutFields));
  filteredHeadLayoutData = _.compact(headLayoutData);

  // Assign headData, headLayoutData, splashHeaderData, and mainData to the pageData obj
  Object.assign(pageData, filteredHeadData[0], filteredHeadLayoutData[0], getMainArticleData);

  // Strip html, remove falsey values, and count # of words
  resolvedArticleContent = _.map(resolveObj(pageData.content), item => stripTags(item));
  filteredArticleContent = _.compact(resolvedArticleContent);
  totalWordsInArticleContent = count(filteredArticleContent.toString());

  // Get all product refs and buy urls on the page
  resolvedArticleRefs = _.compact(resolveObjProperty(pageData.content, '_ref'));
  resolvedArticleProductRefs = _.filter(resolvedArticleRefs, function(x) {return x.indexOf(product) !== -1});
  resolvedArticleProductBuyUrls = _.compact(resolveObjProperty(pageData.content, 'buyUrls'));

  if (pageData.content && pageData.ogTitle && pageData.primaryHeadline && pageData.shortHeadline) {
    // Calculate total # of words in article content and page-level fields
    // TODO: clean this up
    pageData.wordCount = _.sum([totalWordsInArticleContent, count(pageData.ogTitle), count(pageData.primaryHeadline), count(pageData.shortHeadline)]);
  } else {
    pageData.wordCount = 0;
  }

  if (pageData.shortHeadline) {
    pageData.shortHeadline = stripTags(pageData.shortHeadline);
  }

  if (pageData.authors) {
    pageData.authors = resolveObj(pageData.authors);
  }

  if (pageData.tags) {
    pageData.tags = resolveObj(pageData.tags.items);
  }

  pageData.ogTitle = pageData.ogTitle || '';
  pageData.pageType = pageData.pageType || '';
  pageData.siteName = pageData.siteName || '';
  pageData.twitterTitle = pageData.twitterTitle || '';
  pageData.vertical = pageData.vertical || '';
  pageData.contentChannel = pageData.contentChannel || '';
  pageData.primaryHeadline = stripTags(pageData.primaryHeadline) || '';
  pageData.productIds = resolvedArticleProductRefs;
  pageData.productBuyUrls = resolvedArticleProductBuyUrls;
  pageData.pageUri = instanceUri.replace('http://172.24.17.157', 'www.thecut.com');
  pageData.cmsSource = 'clay';
  pageData.featureTypes = _.keys(_.pickBy(pageData.featureTypes));
  pageData.domain = 'thecut.com';
  // Add a timestamp for every entry creation
  pageData.timestamp = new Date().toISOString();

  // Remove content because we don't need to import it to big query
  pageData = _.omit(pageData, 'content');

  return bq.insertDataAsStream('clay_test', 'test_data', [pageData]);

}

module.exports.toBigQuery = articleToBigQuery;
