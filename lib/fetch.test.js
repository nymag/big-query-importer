'use strict';

const sinon = require('sinon'),
  expect = require('chai').expect,
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./' + filename),
  throttle = require('./throttle'),
  // list with 5 page instances
  mockPageListJsonString = '["types.nymag.sites.aws.nymetro.com/thejob/pages/index","types.nymag.sites.aws.nymetro.com/thejob/pages/new","types.nymag.sites.aws.nymetro.com/thejob/pages/new-feature-lede","types.nymag.sites.aws.nymetro.com/thejob/pages/new-sponsored","types.nymag.sites.aws.nymetro.com/thejob/pages/new-sponsored-one-column"]',
  mockPageListData = JSON.parse(mockPageListJsonString),
  mockPageJsonString = '{"some":"data"}',
  mockPageData = JSON.parse(mockPageJsonString),
  mockDataTransformedForBigQuery = {data: 'transformed-for-bq'};

/* eslint-disable max-nested-callbacks */

describe(dirname, function () {
  describe(filename, function () {
    let sandbox,
      requestStub,
      mapStub;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      requestStub = sandbox.stub();
      sandbox.stub(throttle, 'requestPromise').returns({req: requestStub});
      mapStub = sandbox.stub().returns(mockDataTransformedForBigQuery);
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('fetchListInstances', function () {
      const fn = lib[this.title];

      it('requests list and calls fetchInstance for all instances in the list', function () {
        let mockUrl = 'http://site.com/pages';

        sandbox.stub(lib, 'fetchInstance').returns(Promise.resolve(mockPageData));
        requestStub.returns(Promise.resolve(mockPageListJsonString));
        return fn(mockUrl, mapStub).then(() =>
          expect(requestStub.firstCall.args[0].url).to.equal(mockUrl) &&
          expect(lib.fetchInstance.callCount).to.equal(5) &&
          [0, 1, 2, 3, 4].forEach(
            i => expect(lib.fetchInstance.getCall(i).args[0]).to.equal(mockPageListData[i])
          )
        );
      });
    });

    describe('fetchInstance', function () {
      const fn = lib[this.title];

      it('requests an instance', function () {
        let mockUrl = 'site.com/pages/one-instance';

        requestStub.returns(Promise.resolve(mockPageJsonString));
        return fn(mockUrl, mapStub).then(() =>
          expect(requestStub.firstCall.args[0].url).contains(mockUrl) &&
          expect(requestStub.callCount).to.equal(1)
        );
      });
      it('only requests published instance json', function () {
        let mockUrl = 'site.com/pages/one-instance';

        requestStub.returns(Promise.resolve(mockPageJsonString));
        return fn(mockUrl, mapStub).then(() =>
          expect(requestStub.firstCall.args[0].url).to.equal('http://site.com/pages/one-instance@published.json')
        );
      });
      it('transforms data from clay to bigquery using map function', function () {
        const mockUrl = 'site.com/pages/one-instance',
          publishedUrl = mockUrl + '@published';

        requestStub.returns(Promise.resolve(mockPageJsonString));
        return fn(mockUrl, mapStub).then(obj =>
          expect(mapStub.callCount).to.equal(1) &&
          expect(mapStub.calledWithExactly(publishedUrl, mockPageData)).to.be.true &&
          expect(obj).to.deep.equal(mockDataTransformedForBigQuery)
        );
      });
    });

  });
});

/* eslint-enable max-nested-callbacks */
