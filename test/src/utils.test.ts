import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import {
  loweredTitleCase,
  toTitleCase,
  isPromise,
  flowFindFirst,
  memoizeAsync,
} from '../../src/utils'

describe('/src/utils.ts', () => {
  describe('#memoizeAsync()', () => {
    it('should only call the method passed in once even after two calls', async () => {
      const method = sinon.stub().returns('hello-world')
      const instance = memoizeAsync<any, any>(method)
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
})
