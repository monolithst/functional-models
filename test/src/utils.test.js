const assert = require('chai').assert
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { loweredTitleCase, createUuid, lazyValue } = require('../../src/utils')

describe('/src/utils.js', () => {
  describe('#lazyValue()', () => {
    it('should only call the method passed in once even after two calls', async () => {
      const method = sinon.stub().returns('hello-world')
      const instance = lazyValue(method)
      await instance()
      await instance()
      sinon.assert.calledOnce(method)
    })
  })
  describe('#loweredTitleCase()', () => {
    it('should turn TitleCase into titleCase', () => {
      const actual = loweredTitleCase('TitleCase')
      const expected = 'titleCase'
      assert.equal(actual, expected)
    })
  })
  describe('#createUuid()', () => {
    before(() => {
      window = undefined
    })
    after(() => {
      window = undefined
    })
    describe('when not having access to "window"', () => {
      it('should call get-random-values 31 times with hello-crypto', () => {
        const getRandomValues = sinon.stub().returns('hello-crypto')
        const utils = proxyquire('../../src/utils', {
          'get-random-values': getRandomValues,
        })
        const actual = utils.createUuid()
        sinon.assert.callCount(getRandomValues, 31)
      })
    })
    describe('when in a browser with "window"', () => {
      it('should call window.crypto when it exists 31 times with hello-crypto', () => {
        const getRandomValues = sinon.stub().returns('hello-crypto')
        window = {
          crypto: {
            getRandomValues,
          },
        }
        const actual = createUuid()
        sinon.assert.callCount(getRandomValues, 31)
      })
      it('should call window.myCrypto when it exists 31 times with hello-crypto', () => {
        const getRandomValues = sinon.stub().returns('hello-crypto')
        window = {
          msCrypto: {
            getRandomValues,
          },
        }
        const actual = createUuid()
        sinon.assert.callCount(getRandomValues, 31)
      })
    })
  })
})
