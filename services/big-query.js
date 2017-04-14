'use strict';

const BigQuery = require('@google-cloud/bigquery'),
  projectId = 'nymag-analaytics-dev',
  bigquery = BigQuery({projectId: projectId}),
  datasetName = 'test_automated_sync';

// Create a new dataset
bigquery.createDataset(datasetName)
  .then((results) => {
    console.log(results);
    const dataset = results[0];

    console.log(`Dataset ${dataset.id} created.`);
  });