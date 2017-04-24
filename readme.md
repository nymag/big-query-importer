Google BigQuery Importer
========================

bq-importer gets all published pages from [Clay](https://github.com/nymag/sites), maps their data to a schema that [Google BigQuery](https://cloud.google.com/bigquery/) accepts, and imports the data as a stream directly to a specified table within a specified dataset.

Any logic beyond mapping values from Clay to values in BigQuery should be avoided.

Setup
=====

- git clone
- nvm install v6
- npm install
- create `keyfile.json` with BigQuery account keys
    - ask another dev or download the bq-importer service account keys from [Google Cloud Platform](https://console.cloud.google.com/apis/credentials?project=nymag-analaytics-dev).

Commands
========

- `npm test` - runs eslint and mocha tests
- `./bin/cli.js` - imports Clay page data to BigQuery
    - For help run `node app.js --help`
    - Normal usage:
        - Run command for each site
        - View imported data in [BigQuery UI](https://bigquery.cloud.google.com)

Development
===========

## Directory Structure

```
    app.js              - entrypoint for yargs
    lib/                - main library called by app.js
    modules/            - each type of instance may need a different mapping to big query
        page/           - example of one module for page instances
            schema.json - the app assumes this file describes the Big Query table
            transform.js- the app assunes this file converts composed instance json to big query data object
```

## Code Style

Matches other <a href="https://github.com/nymag">New York Media</a> repos; linted by <a href="https://github.com/eslint/eslint">eslint</a>.

We are using bluebird for promises and lodash for basic utilities; otherwise vanilla.

## TODO

* Write tests for services
* Tests for modules
* Memory limits
* `--offset` and `--limit` options to do partial imports
* Import any component into big query e.g. `--url http://nymag.com/selectall/components/ads/instances`?
* Import/update individual page e.g. `--url http://nymag.com/selectall/pages/ciok8qoo300qrmxy8kjobasli`?
