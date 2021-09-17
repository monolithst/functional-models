const assert = require('chai').assert
const sinon = require('sinon')
const { lazyValue } = require('../../src/lazy')

describe('/src/lazy.js', () => {
  describe('#lazyValue()', () => {
    it('should only call the method passed in once even after two calls', async () => {
      const method = sinon.stub().returns('hello-world')
      const instance = lazyValue(method)
      await instance()
      await instance()
      sinon.assert.calledOnce(method)
    })
  })
})
