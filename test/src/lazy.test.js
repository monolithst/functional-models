const assert = require('chai').assert
const { lazyProperty } = require('../../src/lazy')

describe('/src/lazy.js', () => {
  describe('#lazyProperty()', () => {
    it('should call the selector that is passed in', async () => {
      const inputs = [
        'lazy',
        () => 'hello world',
        { selector: value => value.slice(6) },
      ]
      const obj = lazyProperty(...inputs)
      const actual = await obj.getLazy()
      const expected = 'world'
      assert.deepEqual(actual, expected)
    })
    it('should return the lazy value that is passed in', async () => {
      const inputs = ['lazy', () => 'hello world']
      const obj = lazyProperty(...inputs)
      const actual = await obj.getLazy()
      const expected = 'hello world'
      assert.deepEqual(actual, expected)
    })
  })
})
