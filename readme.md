Google BigQuery Importer
========

bq-importer gets all published pages from <a href="https://github.com/nymag/sites">Clay</a>, maps their data to a schema that <a href="https://cloud.google.com/bigquery/">Google BigQuery</a> accepts, and imports the data as a stream directly to a specified dataset and table.

Any logic beyond mapping values from Clay to values in BigQuery should be avoided.

## Usage
All commands require the following arguments:

`--url`: The `pages` url of the site to get data from, e.g. `http://nymag.com/scienceofus/pages/`
`--dataset`: A new or existing BigQuery dataset to write data to, e.g. `clay_dataset`
`--table`: A new or existing BigQuery table (within a new/existing dataset) to write data to, e.g. `clay_table`

Development
===========

## Local Development
`npm test` - runs eslint and mocha tests

`node app.js --url http:nymag.com/selectall/pages --dataset selectall_dataset --table selectall_table` - imports Clay page data to BigQuery

## Code Style

Matches other New York Media repos; linted by eslint.

## Flow

1. Run a command for each site, e.g. `node app.js --url http:nymag.com/selectall/pages --dataset selectall_dataset --table selectall_table`
2. View imported data via the <a href="https://bigquery.cloud.google.com">BigQuery UI</a>

# TODO

* Write tests
* Runs tests on CircleCi on open PRs
