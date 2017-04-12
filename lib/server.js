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
  sites = [''],
  pages = sites.map(site => {
    let options = {
      url: `http://types.grubstreet.sites.aws.nymetro.com/${site}/pages`,
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
                articlesData = {},
                mainData = results.main ? results.main[0] : {},
                splashHeaderData = results.splashHeader ? results.splashHeader[0] : {},
                headLayoutData = results.headLayout,
                primaryHeadData = results.head,
                headData = headLayoutData.concat(primaryHeadData),
                headDataArr = [],
                filterHeadData,
                headDataObj,
                allArticleData;

                Object.assign(articlesData, mainData, splashHeaderData);
                allArticleData = _.pick(articlesData, articleFields);

                // pick and filter duplicate head data
                // TODO: this is a mess so clean this up
                headData.forEach(function (item) {
                  let data = _.pick(item, ['clayType', 'twitterTitle', 'siteName', 'ogTitle']);
                  headDataArr.push(data);
                });

                filterHeadData = headDataArr.filter(value => Object.keys(value).length !== 0);
                headDataObj = filterHeadData.reduce(function(data, item) {
                  let x = Object.keys(item)[0],
                    y = Object.keys(item)[1];
                  data[x] = item[x];
                  if (y) {
                    data[y] = item[y];
                  }
                  return data;
                },{});

              // assign all article data, and head data to obj
              Object.assign(obj, allArticleData, headDataObj);
              obj.pageUri = uri;
              obj.cmsSource = 'clay';
              if (obj.authors) {
                obj.authors = resolveObj(obj.authors);
              }
              if (obj.tags) {
                obj.tags = resolveObj(obj.tags.items);
              }
              obj.featureTypes = _.keys(_.pickBy(obj.featureTypes));
              obj.domain = 'grubstreet.com';

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
