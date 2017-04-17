'use strict';

const BigQuery = require('@google-cloud/bigquery'),
  projectId = 'nymag-analaytics-dev',
  date = Date.now(),
  path = require('path'),
  fs = require('fs'),
  schemaFile = path.join(__dirname, '../data/schema.json'),
  dataFile = path.join(__dirname, '../data/data.json'),
  bigquery = require('@google-cloud/bigquery')({
    projectId: projectId,
    keyFilename: './keyfile.json'
  }),
  datasetName = `clay_data_${date}`,
  tableId = 'clay_data',
  schema = fs.readFileSync(schemaFile, 'utf8'),
  options = JSON.parse(schema);


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
          return table.insert(data)
            .then((data) => {
              console.log('this is our data', data);
            })
        })
    });
}


/*createDatasetAndInsertData(datasetName, tableId, options, {"date":"2017-04-10T16:28:42+00:00","canonicalUrl":"http://types.nymag.sites.aws.nymetro.com/selectall/2017/04/original-video-on-selectall.html","primaryHeadline":"original video on SelectAll","seoHeadline":"","overrideHeadline":"original video on SelectAll","shortHeadline":"original video on SelectAll","syndicatedUrl":"","featureTypes":["First-Person Essay"],"tags":["original video"],"contentChannel":"Products-Apps-Software","authors":["Mediha Aziz"],"clayType":"Video Pages","siteName":"Select All","pageUri":"types.nymag.sites.aws.nymetro.com/selectall/pages/cj1cboxz0001s0hs90wae4pfo","cmsSource":"clay","domain":"nymag.com"});
*/

module.exports.createDataset = createDataset;
module.exports.createTable = createTable;