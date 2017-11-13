'use strict';

const _ = require('lodash'),
  stripTags = require('striptags'),
  product = 'components/product',
  bq = require('../../services/big-query.js'),
  schema = require('./schema.json');

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
    productRefs,
    products;

  // Assign main article data to the pageData obj
  Object.assign(pageData, getMainArticleData);


  productRefs = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(product_ref);
    }
    return results;
  }, []);


  products = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref'),
      productData = {};
    if (product_ref.indexOf(product) !== -1) {
      if (item.description && item.description.length > 0) {
        
        productData.description = stripTags(resolveObjProperty(item.description, 'text'));
        productData.productId = item.productId;
        productData.name = item.name;
        productData.priceLow = item.priceLow;
        productData.priceHigh = item.priceHigh;
        productData.buyUrl = item.buyUrl;
        productData.ref = product_ref;
        productData.vendor = item.vendor;

        results.push(productData);
      } 
    }
    console.log('what are results');
    console.log(results);
    return results;
  }, []);

  // Only import to bq if products exist on the page
  if (productRefs.length > 0) {
      _.forEach(products, function (product) {
        var bqData = {};
        bqData.productRef = product.ref;
        bqData.productName = product.name;
        bqData.productHighPrice = product.highPrice;
        bqData.productLowPrice = product.lowPrice;
        bqData.productUrl = product.buyUrl;
        bqData.productVendor = product.vendor;
        bqData.site = 'The Strategist';
        bqData.timestamp = new Date();
        bqData.productPageUri = instanceUri.replace('http://172.24.17.157', 'http://nymag.com');
        bqData.productId = product.productId;
        bqData.productDescription = product.description;

        return bq.insertDataAsStream('products', 'nymag_products', [bqData]);
    })
  }
}

module.exports.toBigQuery = articleToBigQuery;
