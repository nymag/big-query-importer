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


function createDataset(datasetName) {
  return bigquery.createDataset(datasetName)
    .then((results) => {
      const dataset = results[0];

      console.log(`Dataset ${dataset.id} created.`);
      return dataset;
  });
}


function createTable(dataset, tableId, options) {
  return dataset.createTable(tableId, options)
    .then((results) => {
      const table = results[0];

      console.log(`Table ${table.id} created.`);
      return table;
  });
}


function createDatasetAndInsertData(datasetName, tableId, options, data) {
  return createDataset(datasetName)
    .then((results) => {
      return createTable(results, tableId, options)
        .then((table) => {
          let clayData = _.map(data, item => table.insert(item))
          return clayData;
        })
    });
}

module.exports.createDataset = createDataset;
module.exports.createTable = createTable;
module.exports.createDatasetAndInsertData = createDatasetAndInsertData;