import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { loweredTitleCase, createUuid, toTitleCase } from '../../src/utils'

describe('/src/utils.ts', () => {
  describe('#toTitleCase()', () => {
    it('should make camelCase into CamelCase', () => {
      const input = 'camelCase'
      const actual = toTitleCase(input)
      const expected = 'CamelCase'
      assert.equal(actual, expected)
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
      // @ts-ignore
      globalThis.global.window = undefined
    })
    after(() => {
      // @ts-ignore
      globalThis.global.window = undefined
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
          // @ts-ignore
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
          // @ts-ignore
          msCrypto: {
            getRandomValues,
          },
        }
        const actual = createUuid()
        sinon.assert.callCount(getRandomValues, 31)
      })
      it('should call get-random-values 31 times with hello-crypto if crypto and msCrypto are not available', () => {
        const getRandomValues = sinon.stub().returns('hello-crypto')
        // @ts-ignore
        window = {}
        const utils = proxyquire('../../src/utils', {
          'get-random-values': getRandomValues,
        })
        const actual = utils.createUuid()
        sinon.assert.callCount(getRandomValues, 31)
      })
    })
  })
})
