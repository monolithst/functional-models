import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import {
  loweredTitleCase,
  createUuid,
  toTitleCase,
  isPromise,
  flowFindFirst,
  memoizeAsync,
  threeitize,
} from '../../src/utils'

describe('/src/utils.ts', () => {
  describe('#threeitize()', () => {
    it('should throw an exception if there are 4 values', () => {
      assert.throws(() => {
        threeitize(['a', 'b', 'c', 'd'])
      }, 'Must be an odd number of 3 or greater')
    })
    it('should allow 5 values', () => {
      const actual = threeitize(['a', 'b', 'c', 'd', 'e'])
      const expected = [
        ['a', 'b', 'c'],
        ['c', 'd', 'e'],
      ]
      assert.deepEqual(actual, expected)
    })
    it('should throw an exception if there are 6 values', () => {
      assert.throws(() => {
        threeitize(['a', 'b', 'c', 'd', 'e', 'f'])
      }, 'Must be an odd number of 3 or greater')
    })
    it('should throw an exception if there are 8 values', () => {
      assert.throws(() => {
        threeitize(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
      }, 'Must be an odd number of 3 or greater')
    })
    it('should create the expected structure by walking down and grouping', () => {
      const actual = threeitize(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])
      const expected = [
        ['a', 'b', 'c'],
        ['c', 'd', 'e'],
        ['e', 'f', 'g'],
        ['g', 'h', 'i'],
      ]
      assert.deepEqual(actual, expected)
    })
  })
  describe('#memoizeAsync()', () => {
    it('should only call the method passed in once even after two calls', async () => {
      const method = sinon.stub().returns('hello-world')
      const instance = memoizeAsync(method)
      await instance()
      await instance()
      sinon.assert.calledOnce(method)
    })
  })
  describe('#flowFindFirst()', () => {
    it('should run 2 out of the 3 functions when the first returns undefined, and the second returns a string', () => {
      const input = [
        sinon.stub().callsFake(v => (v === 'cat' ? 'cat' : undefined)),
        sinon.stub().callsFake(v => (v === 'dog' ? 'dog' : undefined)),
        sinon
          .stub()
          .callsFake(v => (v === 'mongoose' ? 'mongoose' : undefined)),
      ]
      const input2 = 'dog'
      const actual = flowFindFirst(input)(input2)
      assert.isFalse(input[2].called)
    })
    it('should return "dog"', () => {
      const input = [
        sinon.stub().callsFake(v => (v === 'cat' ? 'cat' : undefined)),
        sinon.stub().callsFake(v => (v === 'dog' ? 'dog' : undefined)),
        sinon
          .stub()
          .callsFake(v => (v === 'mongoose' ? 'mongoose' : undefined)),
      ]
      const input2 = 'dog'
      const actual = flowFindFirst(input)(input2)
      const expected = 'dog'
      assert.equal(actual, expected)
    })
    it('should run 3 out of the 3 functions when all of them return undefined', () => {
      const input = [
        sinon.stub().callsFake(v => (v === 'cat' ? 'cat' : undefined)),
        sinon.stub().callsFake(v => (v === 'dog' ? 'dog' : undefined)),
        sinon
          .stub()
          .callsFake(v => (v === 'mongoose' ? 'mongoose' : undefined)),
      ]
      const input2 = 'snake'
      flowFindFirst(input)(input2)
      const actual = input.reduce((count, func) => (count += func.callCount), 0)
      const expected = 3
      assert.equal(actual, expected)
    })
    it('should return undefined when all fail', () => {
      const input = [
        sinon.stub().callsFake(v => (v === 'cat' ? 'cat' : undefined)),
        sinon.stub().callsFake(v => (v === 'dog' ? 'dog' : undefined)),
        sinon
          .stub()
          .callsFake(v => (v === 'mongoose' ? 'mongoose' : undefined)),
      ]
      const input2 = 'snake'
      const actual = flowFindFirst(input)(input2)
      assert.isUndefined(actual)
    })
  })

  describe('#isPromise()', () => {
    it('should return false if null is passed in', () => {
      const actual = isPromise(null)
      const expected = false
      assert.equal(actual, expected)
    })
  })
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
