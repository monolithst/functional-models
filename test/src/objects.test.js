const assert = require('chai').assert
const { smartObject } = require('../../src/objects')

describe('/src/objects.js', () => {
  describe('#smartObject()', () => {
    it('should allow a single value for internals', async () => {
      const instance = smartObject({
        key: 'value',
      })
      const actual = await instance.key
      const expected = 'value'
      assert.deepEqual(actual, expected)
    })
    it('should merge metaProperties', () => {
      const instance = smartObject(
        {
          key: 'value',
        },
        { metaProperties: { test: 'me' } }
      )
      const actual = instance.meta.test
      const expected = 'me'
      assert.deepEqual(actual, expected)
    })
    it('should allow a null metaProperties passed in', () => {
      const instance = smartObject(
        {
          key: 'value',
        },
        { metaProperties: null }
      )
      const actual = instance.meta
      const expected = undefined
      assert.deepEqual(actual, expected)
    })
    it('should have a "functions" property', () => {
      const actual = smartObject([{ key: 'value' }, { key2: 'value2' }])
        .functions
      assert.isOk(actual)
    })
    it('should combine an array of objects', () => {
      const actual = smartObject([{ key: 'value' }, { key2: 'value2' }])
      const expected = {
        key: 'value',
        key2: 'value2',
      }
      assert.include(actual, expected)
    })
  })
})
