'use strict';

const cli = function () {
  const fetch = require('./lib/fetch.js'),
    bq = require('./services/big-query.js'),
    path = require('path'),
    yargs = require('yargs')
      .options({
        url: {
          alias: 'u',
          demandOption: true,
          describe: 'Provide a Clay page url',
          string: true
        },
        moduleName: {
          alias: 'm',
          demandOption: true,
          describe: 'directory name of module that contains a transform.js to convert clay JSON to BQ, and a schema.json to describe the BQ data structure. e.g.: page',
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
        },
        list: {
          alias: 'l',
          demandOption: false,
          default: false,
          describe: 'Specify a list of instances',
          boolean: true
        },
        start: {
          alias: 's',
          demandOption: false,
          describe: 'Integer representing index to start reading from source (inclusive)',
          integer: true
        },
        end: {
          alias: 'e',
          demandOption: false,
          default: 0,
          describe: 'Integer representing index to stop reading from source (exclusive)',
          integer: true
        }
      })
      .example('Example for a list of page instances: ./bin/cli.js --url http://qa.nymag.com/selectall/pages --moduleName page --dataset selectall_dataset_pages --table selectall_table --list --start 20 --end 50')
      .example('Example for an individual page instance: ./bin/cli.js --url http://qa.nymag.com/travel/pages/cj3fuvbj5004jbwye1ret8k7h --moduleName page --dataset travel_dataset --table travel_table')
      .help('help')
      .alias('help', 'h')
      .argv,
    modulePath = path.join(__dirname, `./modules/${ yargs.moduleName }`),
    schema = require(`${ modulePath }/schema`);

    if (yargs.list) {
      fetch.fetchListInstances(yargs.url, yargs.dataset, yargs.table, schema, yargs.start, yargs.end)
    } else {
      fetch.fetchSingleInstance(yargs.url, yargs.dataset, yargs.table, schema)
    }
};

module.exports.cli = cli;
