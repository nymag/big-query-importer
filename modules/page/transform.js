'use strict';

const _ = require('lodash'),
  stripTags = require('striptags'),
  count = require('word-count'),
  product = 'components/product',
  paragraph = 'components/clay-paragraph',
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
    productInlineRefs,
    productIds,
    productDescriptions,
    productUrls;

  // Assign headData, headLayoutData, splashHeaderData, and mainData to the pageData obj
  Object.assign(pageData, getMainArticleData);


  /**
   * checks if the link is pointing to amazon.com and allows for sub-domains
   * @param {string} url
   * @returns {boolean}
   */
  function isAmazonUrl(url) {
    const domain = (url.split('://')[1] || '').split('/')[0].toLowerCase();

    return domain.indexOf('amazon.com') === 0 || domain.indexOf('.amazon.com') > 0;
  }

  /**
   * find all of the amazon links in the text and return link url and link text
   * @param {string} text
   * @returns {object} keys are urls and values are the link text
   */
  function reduceToUniqueAmazonUrls(text) {
    // assume `href` is first attribute of anchor
    return text.split('<a href="').reduce(function (urls, anchorFragment) {
      // assume no html tags within anchor text
      // assume href surrounded by quotes, but could have other attributes
      var anchorClose = anchorFragment.indexOf('>'),
        anchor = anchorFragment.substr(0, anchorClose),
        anchorEndQuote = anchor.indexOf('" '),
        url = anchorEndQuote > -1 ? anchor.substr(0, anchorEndQuote) : anchor.substr(0, anchor.length - 1),
        linkText = anchorFragment.substr(anchorClose + 1).split('</a>')[0];

      if (isAmazonUrl(url)) {
        urls[url] = linkText;
      }
      return urls;
    }, {});
  }


  // Brute force approach for now, since I'm lazy
  productNames = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
      if (item.name) {
        results.push(item.name);
      } 
    }
    return results;
  }, []);

  productInlineRefs = _.reduce(pageData.content, function(results, item) {
    var paragraph_ref = _.get(item, '_ref'),
      getAmazonLinks;
    if (paragraph_ref.indexOf(paragraph) !== -1) {
        getAmazonLinks = reduceToUniqueAmazonUrls(item.text)
        results.push(getAmazonLinks);
      } 
    return results;
  }, []);

  console.log('product inline')
  console.log(productInlineRefs);

  productRefs = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
       results.push(product_ref);
    }
    return results;
  }, []);

  productIds = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
      if (item.producdtId) {
        results.push(item.productId);
      } 
    }
    return results;
  }, []);


  productVendors = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
        if (item.vendor) {
          results.push(item.vendor);
        }     
      }
    return results;
  }, []);


  productHighPrices = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
        if (item.priceHigh) {
          results.push(item.priceHigh);
        } 
    }
    return results;
  }, []);

  productLowPrices = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
        if (item.priceLow) {
          results.push(item.priceLow);
        }    
      }
    return results;
  }, []);

  productUrls = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
        if (item.buyUrl) {
          results.push(item.buyUrl);
        } 
    }
    return results;
  }, []);


  productDescriptions = _.reduce(pageData.content, function(results, item) {
    var product_ref = _.get(item, '_ref');
    if (product_ref.indexOf(product) !== -1) {
        if (item.description.length > 0) {
          results.push(item.description[0].text);
        } 
    }
    return results;
  }, []);

  if (productRefs.length > 0) {
    var productData = {};
    productData.productRef = productRefs || '';
    productData.productName = productNames || '';
    productData.productHighPrice = productHighPrices || '';
    productData.productLowPrice = productLowPrices || '';
    productData.productUrl = productUrls || '';
    productData.productVendor = productVendors || '';
    productData.site = 'The Strategist';
    productData.timestamp = new Date();
    productData.productPageUri = instanceUri;
    productData.productId = productIds || '';
    // productData.productDescription = productDescriptions || '';

    return bq.insertDataAsStream('products', 'nymag_products', [productData]);
  }

  // Add a timestamp for every entry creation

  // Remove content because we don't need to import it to big query
  // pageData = _.omit(pageData, 'content');


}

module.exports.toBigQuery = articleToBigQuery;
