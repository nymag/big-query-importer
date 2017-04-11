Overview
========

This repo gets all published pages from clay, maps their data to big query format, and saves to file.

Any logic beyond mapping values from clay to values in bq should be avoided if possible.

Development
===========

## directory structure
```
/lib/server.js - main script
```

## setup

Clone this repo.

## local dev

`npm test` - runs eslint and mocha tests

`npm run start` - runs main script

## code style

Matches other New York Media repos; linted by eslint.

Flow
====

1. run for each site: saves to file
2. upload files to bq through ui

TODO
====

* tests
* script to upload files to big query
* runs tests on circle ci on PRs
