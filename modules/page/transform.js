'use strict';

const _ = require('lodash'),
  stripTags = require('striptags'),
  count = require('word-count'),
  product = 'components/product',
  video = 'components/video',
  ooyala = 'components/ooyala-player',
  image = 'pixel.nymag.com',
  article = 'components/article',
  singleRelatedStory = 'components/single-related-story',
  relatedStory = 'components/related-story',
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


function resolveContentValues(items) {
  return items.reduce((arr, item) => {
      if (item._ref) {
        item = item._ref;
      }
      return arr.concat(JSON.stringify(item));
    }, []);
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
  let pageData = {},
    articleFields = ['date', 'canonicalUrl', 'primaryHeadline', 'seoHeadline', 'overrideHeadline', 'shortHeadline', 'syndicatedUrl', 'featureTypes', 'tags', 'contentChannel', 'authors', 'rubric', 'magazineIssueDate', 'content'],
    headFields = ['twitterTitle', 'ogTitle', 'syndicatedUrl'],
    headLayoutFields = ['siteName', 'pageType', 'vertical'],
    getMainArticleData = _.pick(_.get(instanceJson, 'main[0]', {}), articleFields),
    getMainArticleUri = _.get(instanceJson, 'main[0]._ref'),
    getVideoArticleUri = _.get(instanceJson, 'splashHeader[0]._ref'),
    getSplashHeaderData = _.pick(_.get(instanceJson, 'splashHeader[0]', {}), articleFields), // Video articles store article data in the splashHeader
    getHeadLayoutData = _.get(instanceJson, 'headLayout', {}),
    getHeadData = _.get(instanceJson, 'head', {}),
    resolvedArticleContent,
    resolvedArticleContentValues,
    resolvedSingleRelatedStory,
    resolvedArticleUri,
    resolvedRelatedStory,
    resolvedArticleContentImages,
    resolvedArticleRefs,
    resolvedArticleProductRefs,
    resolvedArticleProductBuyUrls,
    resolvedArticleVideoRefs,
    resolvedArticleOoyalaRefs,
    totalWordsInArticleContent,
    headData,
    headLayoutData;

  headData = _.compact(_.map(getHeadData, item => _.pick(item, headFields)));
  headLayoutData = _.compact(_.map(getHeadLayoutData, item => _.pick(item, headLayoutFields)));

  // Assign headData, headLayoutData, splashHeaderData, and mainData to the pageData obj
  Object.assign(pageData, headData[0], headLayoutData[0], getSplashHeaderData, getMainArticleData);

  resolvedArticleRefs = _.compact(resolveObjProperty(pageData.content, '_ref'));
  resolvedArticleContent = _.map(resolveObj(_.compact(pageData.content)), item => stripTags(item));
  // Object.values doesn't have full browser support yet. Womp.
  resolvedArticleContentValues = _.compact(_.flattenDeep(_.map(pageData.content, item => Object.keys(item).map(key => item[key]))));

  totalWordsInArticleContent = _.map(_.compact([resolvedArticleContent.toString(), pageData.ogTitle, pageData.primaryHeadline, pageData.shortHeadline]), item => count(item));

  // TODO: Can probably consolidate all of these filtered vars
  resolvedArticleUri = _.filter(resolveContentValues(resolvedArticleContentValues), item => item.indexOf(article) !== -1);
  resolvedArticleContentImages = _.filter(resolveContentValues(resolvedArticleContentValues), item => item.indexOf(image) !== -1)
  resolvedArticleProductRefs = _.filter(_.compact(resolvedArticleRefs), item => item.indexOf(product) !== -1);
  resolvedArticleVideoRefs = _.filter(_.compact(resolvedArticleRefs), item => item.indexOf(video) !== -1);
  resolvedArticleOoyalaRefs = _.filter(_.compact(resolvedArticleRefs), item => item.indexOf(ooyala) !== -1);
  resolvedSingleRelatedStory = _.filter(resolveContentValues(resolvedArticleContentValues), item => item.indexOf(singleRelatedStory) !== -1)
  resolvedRelatedStory = _.filter(resolveContentValues(resolvedArticleContentValues), item => item.indexOf(relatedStory) !== -1);

  resolvedArticleProductBuyUrls = _.compact(resolveObjProperty(_.compact(pageData.content), 'buyUrlHistory'));

  // Calculate total # of words in article content and page-level fields
  pageData.wordCount = totalWordsInArticleContent.reduce(function(sum, val) { return sum + val; }, 0)


  if (pageData.authors) {
    pageData.authors = resolveObj(pageData.authors);
  }

  if (pageData.tags) {
    pageData.tags = resolveObj(pageData.tags.items);
  }


  pageData.ogTitle = stripTags(pageData.shortHeadline);
  pageData.overrideHeadline = stripTags(pageData.shortHeadline);
  pageData.shortHeadline = stripTags(pageData.shortHeadline);
  pageData.primaryHeadline = stripTags(pageData.primaryHeadline);
  pageData.productIds = resolvedArticleProductRefs;
  pageData.productIdsCount = resolvedArticleProductRefs.length;
  pageData.videoIds = resolvedArticleVideoRefs;
  pageData.ooyalaIds = resolvedArticleOoyalaRefs;
  pageData.videoIdsCount = resolvedArticleVideoRefs.length;
  pageData.ooyalaIdsCount = resolvedArticleOoyalaRefs.length;
  pageData.productBuyUrls = resolvedArticleProductBuyUrls;
  pageData.imageIds = resolvedArticleContentImages;
  pageData.imageIdsCount = resolvedArticleContentImages.length;
  pageData.singleRelatedStoryIds = resolvedSingleRelatedStory;
  pageData.singleRelatedStoryIdsCount = resolvedSingleRelatedStory.length;
  pageData.relatedStoryIds = resolvedRelatedStory;
  pageData.relatedStoryIdsCount = resolvedRelatedStory.length;
  pageData.pageUri = instanceUri.replace('http://172.24.17.157', 'http://vulture.com');
  // pageData.pageUri = instanceUri;
  pageData.cmsSource = 'clay';
  pageData.featureTypes = _.keys(_.pickBy(pageData.featureTypes));
  pageData.domain = urls.parse(pageData.pageUri).host;

  // The article uri is stored in a different obj depending on pageType 
  if (pageData.pageType === 'Video') {
    pageData.articleUri = getVideoArticleUri;
  } else {
    pageData.articleUri = getMainArticleUri;
  }

  // Add a timestamp for every entry creation
  pageData.timestamp = new Date();

  // Remove content because we don't need to import it to big query
  pageData = _.omit(pageData, 'content');

  return bq.insertDataAsStream('thestrategist', 'strategist_page_data', [pageData]);

}

module.exports.toBigQuery = articleToBigQuery;
