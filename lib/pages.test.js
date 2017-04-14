'use strict';

const sinon = require('sinon'),
  expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename);

describe(dirname, function () {
  describe(filename, function () {
    let sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('hello', function () {
      const fn = lib[this.title];

      it('has a test file', function () {
        expect(true).to.be.true;
      });
    });
  });
});
