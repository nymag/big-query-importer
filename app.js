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
          describe: 'Is this a list of instances',
          boolean: true
        }
      })
      .example('Full example: node app.js --url http://nymag.com/selectall/pages --moduleName page --dataset selectall_dataset --table selectall_table')
      .help('help')
      .alias('help', 'h')
      .argv,
    modulePath = path.join(__dirname, `./modules/${ yargs.moduleName }`),
    schema = require(`${ modulePath }/schema.json`),
    transform = require(`${ modulePath }/transform`);

    if (yargs.list) {
      fetch.fetchListInstances(yargs.url, transform.toBigQuery)
        .then(data => bq.insertDataAsStream(yargs.dataset, yargs.table, schema, data));
    } else {
      fetch.fetchInstance(yargs.url, transform.toBigQuery)
        .then(data => bq.insertDataAsStream(yargs.dataset, yargs.table, schema, [data]));
    }
};

module.exports.cli = cli;
