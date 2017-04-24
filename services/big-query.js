'use strict';

const projectId = 'nymag-analaytics-dev',
  log = require('amphora').log.withStandardPrefix(__filename),
  _ = require('lodash'),
  path = require('path'),
  fs = require('fs'),
  bigquery = require('@google-cloud/bigquery')({
    projectId: projectId,
    keyFilename: './keyfile.json'
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
      const datasets = data[0],
        matchDataset = _.find(datasets, {'id': datasetName}),
        result = matchDataset ? matchDataset : createDataset(datasetName);

        return result;
    });
}

/**
 * Create BigQuery table if it doesn't exist
 * @param {string} dataset
 * @param {string} tableId
 * @param {[]} options, i.e. json schema to pass to BigQuery
 * @returns {Promise}
 */
function createTableIfDoesntExist(dataset, tableId, options) {
  return dataset.getTables()
    .then((data) => {
      const tables = data[0],
        matchTable= _.find(tables, {'id': tableId}),
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
        .catch(logError)
    })
    .catch(logError)
}

module.exports.createDataset = createDataset;
module.exports.createTable = createTable;
module.exports.insertDataAsStream = insertDataAsStream;
