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
    articleFields = ['content'],
    getMainArticleData = _.pick(_.get(instanceJson, 'main[0]', {}), articleFields),
    productHighPrices,
    productLowPrices,
    productNames,
    productVendors,
    productRefs,
    productUrls;

  // Assign headData, headLayoutData, splashHeaderData, and mainData to the pageData obj
  Object.assign(pageData, getMainArticleData);


  // Brute force approach for now, since I'm lazy
  productNames = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(item.name);
    }
    return results;
  }, []);

  console.log('product names')
  console.log(productNames);

  productRefs = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(product_ref);
    }
    return results;
  }, []);


  productVendors = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(item.vendor);
    }
    return results;
  }, []);

  console.log('product vendors')
  console.log(productVendors);

  productHighPrices = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(item.priceHigh);
    }
    return results;
  }, []);

  productLowPrices = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(item.priceLow);
    }
    return results;
  }, []);

  productUrls = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(item.buyUrl);
    }
    return results;
  }, []);


  pageData.productName = productNames || '';
  pageData.productHighPrice = productHighPrices || '';
  pageData.productLowPrice = productLowPrices || '';
  pageData.productUrl = productUrls || '';
  pageData.productVendor = productVendors || '';
  pageData.productRef = productRefs || '';


  // Add a timestamp for every entry creation
  pageData.timestamp = new Date();

  // Remove content because we don't need to import it to big query
  pageData = _.omit(pageData, 'content');

  return bq.insertDataAsStream('products', 'nymag_products', [pageData]);

}

module.exports.toBigQuery = articleToBigQuery;
