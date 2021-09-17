const assert = require('chai').assert
const { uniqueId, field } = require('../../src/fields')

describe('/src/fields.js', () => {
  describe('#field()', () => {
    it('should throw an exception if config.valueSelector is not a function but is set', () => {
      assert.throws(() => {
        field({ valueSelector: 'blah' })
      })
    })
    it('should not throw an exception if config.valueSelector is a function', () => {
      assert.doesNotThrow(() => {
        field({ valueSelector: () => ({}) })
      })
    })
    describe('#createGetter()', () => {
      it('should return a function even if config.value is set to a value', () => {
        const instance = field({ value: 'my-value'})
        const actual = instance.createGetter('not-my-value')
        assert.isFunction(actual)
      })
      it('should return the value passed into config.value regardless of what is passed into the createGetter', async () => {
        const instance = field({ value: 'my-value'})
        const actual = await instance.createGetter('not-my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value passed into createGetter when config.value is not set', async () => {
        const instance = field()
        const actual = await instance.createGetter('my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value of the function passed into createGetter when config.value is not set', async () => {
        const instance = field()
        const actual = await instance.createGetter(() => 'my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
    })
  })
  describe('#uniqueId()', () => {
    describe('#createGetter()', () => {
      it('should call createUuid only once even if called twice', async () => {
        const uniqueField = uniqueId({})
        const getter = uniqueField.createGetter()
        const first = await getter()
        const second = await getter()
        assert.deepEqual(first, second)
      })
      it('should use the uuid passed in', async () => {
        const uniqueField = uniqueId({})
        const getter = uniqueField.createGetter('my-uuid')
        const actual = await getter()
        const expected = 'my-uuid'
        assert.deepEqual(actual, expected)
      })
    })
  })
})