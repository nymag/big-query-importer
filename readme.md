Google BigQuery Importer
========

bq-importer gets all published pages from <a href="https://github.com/nymag/sites">Clay</a>, maps their data to a schema that <a href="https://cloud.google.com/bigquery/">Google BigQuery</a> accepts, and imports the data as a stream directly to a specified table within a specified dataset.

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

## Updating the Schema
Any updates to the BigQuery data schema should be reflected in <a href="https://github.com/nymag/bq-importer/blob/master/data/schema.json">data/schema.json</a>.

## Authenticating Requests to BigQuery API
bq-importer uses its own default service account credentials to access BigQuery tables. Ask another dev for the local keyfile or download the bq-importer service account keys from <a href="https://console.cloud.google.com/apis/credentials?project=nymag-analaytics-dev">Google Cloud Platform</a>.

## Code Style

Matches other <a href="https://github.com/nymag">New York Media</a> repos; linted by <a href="https://github.com/eslint/eslint">eslint</a>.

## Flow

1. Run a command for each site, e.g. `node app.js --url http:nymag.com/selectall/pages --dataset selectall_dataset --table selectall_table`
2. View imported data via the <a href="https://bigquery.cloud.google.com">BigQuery UI</a>

# TODO

* Write tests
* Runs tests on CircleCi on open PRs
