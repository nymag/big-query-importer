'use strict';

const BigQuery = require('@google-cloud/bigquery'),
  projectId = 'nymag-analaytics-dev',
  _ = require('lodash'),
  path = require('path'),
  fs = require('fs'), 
  bigquery = require('@google-cloud/bigquery')({
    projectId: projectId,
    keyFilename: './keyfile.json'
  });

/**
 * Create BigQuery dataset
 * @param {string} datasetName
 * @returns {dataset}
 */
function createDataset(datasetName) {
  return bigquery.createDataset(datasetName)
    .then((results) => {
      const dataset = results[0];

      console.log(`Dataset ${dataset.id} created.`);
      return dataset;
  });
}

/**
 * Create BigQuery table
 * @param {string} dataset
 * @param {string} tableId
 * @param {[]} options, i.e. json schema to pass to BigQuery
 * @returns {table}
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
 * @returns {dataset}
 */
function createDatasetifDoesntExist(datasetName) {
  return bigquery.getDatasets()
    .then((results) => {
      const datasets = _.map(results[0], item => item.id),
        matchDataset = _.find(datasets, function(item) {
            return item == datasetName;
        });

      if (matchDataset === undefined) {
        console.log(`${datasetName} doesn't exist. Creating one...`)
        return createDataset(datasetName);
      }

      return matchDataset;
    });
}

/**
 * Create BigQuery table if it doesn't exist
 * @param {string} dataset
 * @param {string} tableId
 * @param {[]} options, i.e. json schema to pass to BigQuery
 * @returns {table}
 */
function createTableIfDoesntExist(datasetName, tableId, options) {
  const dataset = bigquery.dataset(datasetName.id);

  return dataset.getTables()
    .then((results) => {
      const tables = _.map(results[0], item => item.id),
        matchTable = _.find(tables, function(item) {
            return item == tableId;
        });

      if (matchTable === undefined) {
        console.log(`${tableId} doesn't exist for the ${datasetName.id} dataset. Creating one...`)
        return createTable(dataset, tableId, options);
      }

      return matchTable;
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
    });
}

// Use this for testing
/*insertDataAsStream('automate_test', 'dalia_data', options, [{"twitterTitle":"Select All – Technology and Our Lives Online","ogTitle":"Select All – Technology and Our Lives Online","clayType":"Section Page","siteName":"","pageUri":"types.nymag.sites.aws.nymetro.com/selectall/pages/index","cmsSource":"clay","featureTypes":[],"domain":"nymag.com"}]);*/

module.exports.createDataset = createDataset;
module.exports.createTable = createTable;
module.exports.insertDataAsStream = insertDataAsStream;