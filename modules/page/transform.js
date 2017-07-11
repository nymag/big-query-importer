'use strict';

const _ = require('lodash'),
  stripTags = require('stripTags'),
  count = require('word-count');

/**
 * Resolve object values, e.g. [{text:tag}{text:tag}] becomes [tag, tag]
 * @param {[{}]} items
 * @returns {Array}
 */
function resolveObj(items) {
  return items.reduce((arr, item) => arr.concat(item.text), []);
}

/**
 * Calculate the sum of words in an arr of strings
 * @param {[]} items
 * @returns {integer}
 */
function countTotalWords(items) {
  return items.reduce((prev, next) => prev + next, 0);
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
    articleFields = ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'syndicatedUrl', 'featureTypes', 'tags', 'contentChannel', 'authors', 'rubric', 'magazineIssueDate', 'content'],
    headFields = ['twitterTitle', 'ogTitle', 'syndicatedUrl'],
    headLayoutFields = ['siteName', 'pageType', 'vertical'],
    getMainArticleData = _.pick(_.get(instanceJson, 'main[0]', {}), articleFields),
    getSplashHeaderData = _.get(instanceJson, 'splashHeader[0]', {}),
    getHeadLayoutData = _.get(instanceJson, 'headLayout', {}),
    getHeadData = _.get(instanceJson, 'head', {}),
    resolvedArticleContent,
    filteredArticleContent,
    wordsInArticleContent,
    totalWordsInArticleContent,
    headData,
    headLayoutData,
    filteredHeadData,
    filteredHeadLayoutData;

  headData = _.map(getHeadData, item => _.pick(item, headFields));
  filteredHeadData = headData.filter(value => Object.keys(value).length !== 0);
  headLayoutData = _.map(getHeadLayoutData, item => _.pick(item, headLayoutFields));
  filteredHeadLayoutData = headLayoutData.filter(value => Object.keys(value).length !== 0);

  // Assign headData, headLayoutData, splashHeaderData, and mainData to the pageData obj
  Object.assign(pageData, filteredHeadData[0], filteredHeadLayoutData[0], getSplashHeaderData, getMainArticleData);

  // Resolve article content, strip html and whitespace, and count # of words
  resolvedArticleContent = _.map(resolveObj(pageData.content), item => stripTags(item));
  filteredArticleContent = resolvedArticleContent.filter(item => String(item).trim());
  wordsInArticleContent = _.map(filteredArticleContent, item => count(item));
  totalWordsInArticleContent = countTotalWords(wordsInArticleContent);
  pageData.pageUri = 'http://' + instanceUri;
  pageData.cmsSource = 'clay';

  if (pageData.authors) {
    pageData.authors = resolveObj(pageData.authors);
  }
  if (pageData.tags) {
    pageData.tags = resolveObj(pageData.tags.items);
  }
  // Only display a word count for pages that have article content
  if (pageData.content) {
    // Calculate total # of words in article content and page-level fields
    // TODO: clean this up
    pageData.wordCount = _.sum([totalWordsInArticleContent, count(pageData.ogTitle), count(pageData.primaryHeadline), count(pageData.shortHeadline)]);
  }

  pageData.featureTypes = _.keys(_.pickBy(pageData.featureTypes));
  pageData.domain = 'nymag.com';

  // Remove content because we don't need to import it to big query
  pageData = _.omit(pageData, 'content');

  return pageData;
}

module.exports.toBigQuery = articleToBigQuery;
