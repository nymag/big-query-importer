'use strict';

const BigQuery = require('@google-cloud/bigquery'),
  projectId = 'nymag-analaytics-dev',
  _ = require('lodash'),
  path = require('path'),
  fs = require('fs'), 
  schemaFile = path.join(__dirname, '../data/schema.json'),
  schema = fs.readFileSync(schemaFile, 'utf8'),
  options = JSON.parse(schema),
  bigquery = require('@google-cloud/bigquery')({
    projectId: projectId,
    keyFilename: './keyfile.json'
  });

/**
 * Create BigQuery dataset
 * @param {string} datasetName
 * @returns {Promise}
 */
function createDataset(datasetName) {
  return bigquery.createDataset(datasetName)
    .then((results) => {
      const dataset = results[0];

      console.log(`Dataset ${dataset.id} created.`);
      return dataset;;
  });
}

/**
 * Create BigQuery table
 * @param {string} dataset
 * @param {string} tableId
 * @param {[]} options, i.e. json schema to pass to BigQuery
 * @returns {Promise}
 */
function createTable(dataset, tableId, options) {
  return dataset.createTable(tableId, options)
    .then((results) => {
      const table = results[0];

      console.log(`Table ${table.id} created.`);
      return table;
  });
}

/**
 * Create a BigQuery dataset if it doesn't exist
 * @param {string} datasetName
 * @returns {Promise}
 */
function createDatasetifDoesntExist(datasetName) {
  return bigquery.getDatasets()
    .then((data) => {
      const dataset = data[0],
        matchDataset = _.find(dataset, {'id': datasetName}),
        result = matchDataset ? matchDataset : createDataset(datasetName);

        return result;
    });
}

/**
 * Create BigQuery table if it doesn't exist
 * @param {string} dataset
 * @param {string} tableId
 * @param {[]} options, i.e. json schema to pass to BigQuery
 * @returns {table}
 */
function createTableIfDoesntExist(dataset, tableId, options) {
  return dataset.getTables()
    .then((data) => {
      const table = data[0],
        matchTable= _.find(table, {'id': tableId}),
        result = matchTable ? matchTable : createTable(dataset, tableId, options)

        return result;
    });
}

/**
 * Insert BigQuery data as a stream
 * @param {string} datasetName
 * @param {string} tableId
 * @param {[]} options, i.e. json schema to pass to BigQuery
 * @param {[{}]} Clay page data
 * @returns {}
 */
function insertDataAsStream(datasetName, tableId, options, data) {
  return createDatasetifDoesntExist(datasetName)
    .then((results) => {
      return createTableIfDoesntExist(results, tableId, options)
        .then((table) => {
          let clayData = _.map(data, item => table.insert(item));
          return clayData;
      })
    })
}

// Use this for testing
//insertDataAsStream('automate_2', 'dalia_data_2', options, [{"date":"2017-04-10T16:28:42+00:00","canonicalUrl":"http://types.nymag.sites.aws.nymetro.com/selectall/2017/04/original-video-on-selectall.html","primaryHeadline":"original video on SelectAll","seoHeadline":"","overrideHeadline":"original video on SelectAll","shortHeadline":"original video on SelectAll","syndicatedUrl":"","featureTypes":["First-Person Essay"],"tags":["original video"],"contentChannel":"Products-Apps-Software","authors":["Mediha Aziz"],"clayType":"Video Pages","siteName":"Select All","pageUri":"types.nymag.sites.aws.nymetro.com/selectall/pages/cj1cboxz0001s0hs90wae4pfo","cmsSource":"clay","domain":"nymag.com"}]);

module.exports.createDataset = createDataset;
module.exports.createTable = createTable;
module.exports.insertDataAsStream = insertDataAsStream;