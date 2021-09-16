const assert = require('chai').assert
const { smartObject } = require('../../src/objects')
const { uniqueId } = require('../../src/properties')
const { smartObjectReference } = require('../../src/references')

describe('/src/references.js', () => {
  describe('#smartObjectReference()', () => {
    it('should return an object with getMyObject as a property for a key of "MyObject"', async () => {
      const input = ['MyObject', 'obj-id']
      const instance = smartObjectReference({})(...input)
      const actual = instance.getMyObject
      assert.isOk(actual)
    })
    it('should return "obj-id" when no fetcher is used', async () => {
      const input = ['MyObject', 'obj-id']
      const instance = smartObjectReference({})(...input)
      const actual = await instance.getMyObject()
      const expected = 'obj-id'
      assert.equal(actual, expected)
    })
    it('should allow null as the input', async () => {
      const input = ['MyObject', null]
      const instance = smartObjectReference({})(...input)
      const actual = await instance.getMyObject()
      const expected = null
      assert.equal(actual, expected)
    })
    it('should return "obj-id" from {}.id when no fetcher is used', async () => {
      const input = ['MyObject', { id: 'obj-id' }]
      const instance = smartObjectReference({})(...input)
      const actual = await instance.getMyObject()
      const expected = 'obj-id'
      assert.equal(actual, expected)
    })
    it('should return prop: "switch-a-roo" when switch-a-roo fetcher is used', async () => {
      const input = ['MyObject', 'obj-id']
      const instance = smartObjectReference({
        fetcher: () => ({ id: 'obj-id', prop: 'switch-a-roo' }),
      })(...input)
      const actual = await instance.getMyObject()
      const expected = 'switch-a-roo'
      assert.deepEqual(actual.prop, expected)
    })
    it('should combine functions when switch-a-roo fetcher is used', async () => {
      const input = ['MyObject', 'obj-id']
      const instance = smartObjectReference({
        fetcher: () => ({
          id: 'obj-id',
          prop: 'switch-a-roo',
          functions: { myfunc: 'ok' },
        }),
      })(...input)
      const actual = (await instance.getMyObject()).functions.myfunc
      const expected = 'ok'
      assert.deepEqual(actual, expected)
    })
    it('should take the smartObject as a value', async () => {
      const input = ['MyObject', smartObject([uniqueId('obj-id')])]
      const instance = smartObjectReference({})(...input)
      const classThing = await instance.getMyObject()
      const actual = await (await instance.getMyObject()).getId()
      const expected = 'obj-id'
      assert.deepEqual(actual, expected)
    })
    describe('#functions.toJson()', () => {
      it('should use the getId of the smartObject passed in when toJson is called', async () => {
        const input = ['MyObject', smartObject([uniqueId('obj-id')])]
        const instance = smartObjectReference({})(...input)
        const actual = await (await instance.getMyObject()).functions.toJson()
        const expected = 'obj-id'
        assert.deepEqual(actual, expected)
      })
      it('should return "obj-id" when switch-a-roo fetcher is used and toJson is called', async () => {
        const input = ['MyObject', 'obj-id']
        const instance = smartObjectReference({
          fetcher: () => ({ id: 'obj-id', prop: 'switch-a-roo' }),
        })(...input)
        const actual = await (await instance.getMyObject()).functions.toJson()
        const expected = 'obj-id'
        assert.deepEqual(actual, expected)
      })
    })
  })
})
