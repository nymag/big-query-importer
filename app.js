'use strict';

const pages = require('./lib/pages.js'),
  bq = require('./services/big-query.js'),
  path = require('path'),
  fs = require('fs'),
  date = Date.now(),
  datasetName = `clay_data_${date}`,
  tableId = 'clay_data',
  schemaFile = path.join(__dirname, './data/schema.json'),
  schema = fs.readFileSync(schemaFile, 'utf8'),
  options = JSON.parse(schema),
  yargs = require('yargs')
  .options({
    url: {
      alias: 'u',
      demandOption: true,
      describe: 'Fetch page data from a Clay url',
      string: true
    }
  })
  .help('h')
  .alias('h', 'help')
  .argv;

pages.page(yargs.url)
.then((data) => {
  return bq.createDatasetAndInsertData(datasetName, tableId, options, data);
})

