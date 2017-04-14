const pages = require('./lib/pages.js'),
  fs = require('graceful-fs'),
  path = require('path'),
  file = path.join(__dirname, './data/data.json'),
  yargs = require('yargs')
  .options({
    url: {
      alias: 'u',
      demandOption: true,
      describe: 'Fetch page data from a clay url',
      string: true
    }
  })
  .help('h')
  .alias('h', 'help')
  .argv;


pages.page(yargs.url)
.map((data) => {
  // write objects to a file to upload to Big Query
  // TODO: connect to BQ's API directly
  fs.appendFile(file, JSON.stringify(data) + '\n');
})

