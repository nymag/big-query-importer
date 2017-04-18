'use strict';

const pages = require('./lib/pages.js'),
  bq = require('./services/big-query.js'),
  path = require('path'),
  fs = require('fs'),
  schemaFile = path.join(__dirname, './data/schema.json'),
  schema = fs.readFileSync(schemaFile, 'utf8'),
  options = JSON.parse(schema),
  yargs = require('yargs')
  .options({
    url: {
      alias: 'u',
      demandOption: true,
      describe: 'Provide a Clay page url',
      string: true
    },
    dataset: {
      alias: 'd',
      demandOption: true,
      describe: 'Provide the name of a BigQuery dataset',
      string: true
    },
    table: {
      alias: 't',
      demandOption: true,
      describe: 'Provide the name of a BigQuery table',
      string: true
    }
  })
  .help('h')
  .alias('h', 'help')
  .argv;

pages.page(yargs.url)
.then((data) => {
  return bq.insertDataAsStream(yargs.dataset, yargs.table, options, data);
})

