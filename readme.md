Google BigQuery Importer
========

bq-importer gets all published pages from <a href="https://github.com/nymag/sites">Clay</a>, maps their data to a schema that <a href="https://cloud.google.com/bigquery/">Google BigQuery</a> accepts, and saves to file.

Any logic beyond mapping values from Clay to values in BigQuery should be avoided.

Development
===========

## Usage
All commands require a `--url` argument, which is the `pages` url of the site to get data from, e.g. `http://nymag.com/scienceofus/pages/`

## Local Development
`npm test` - runs eslint and mocha tests

`node app.js --url http://nymag.com/scienceofus/pages/` - appends a site's page data to a file in the `data` directory

## Code Style

Matches other New York Media repos; linted by eslint.

## Flow

1. Run command for each site: saves to file in the /data/ dir
2. Upload files to BigQuery via their <a href="https://bigquery.cloud.google.com">UI</a>

# TODO

* Write tests
* Write data directly to a BigQuery dataset instead of to a file
* Runs tests on CircleCi on open PRs
