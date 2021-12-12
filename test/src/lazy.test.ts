import { assert } from 'chai'
import sinon from 'sinon'
import { lazyValue } from '../../src/lazy'

describe('/src/lazy.ts', () => {
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
