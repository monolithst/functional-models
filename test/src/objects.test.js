const assert = require('chai').assert
const { smartObject, smartObjectPrototype } = require('../../src/objects')
const { field } = require('../../src/fields')

describe('/src/objects.js', () => {
  describe('#smartObjectPrototype()', () => {
    it('should return a function when called once with valid data', () => {
      const actual = smartObjectPrototype({})
      const expected = 'function'
      assert.isFunction(actual)
    })
    describe('#()', () => {
      it('should return an object with getId and getType for the provided valid keyToField', () => {
        const input = {
          id: field({ required: true}),
          type: field(),
        }
        const proto = smartObjectPrototype(input)
        const actual = proto({id: 'my-id', type: 'my-type'})
        console.log(actual)
        assert.isOk(actual.getId)
        assert.isOk(actual.getType)
      })
      it('should return an object where validate returns one error for id', async () => {
        const input = {
          id: field({ required: true}),
          type: field(),
        }
        const proto = smartObjectPrototype(input)
        const instance = proto({type: 'my-type'})
        const actual = await instance.functions.validate.object()
        const expected = 1
        console.log(actual)
        assert.equal(Object.values(actual).length, 1)
      })
    })
    it('should return a function when called once with valid data', () => {
      const actual = smartObjectPrototype({})
      const expected = 'function'
      assert.isFunction(actual)
    })
  })
  describe('#smartObject()', () => {
    it('should use the functions.validation of two objects correctly', async () => {
      const instance = smartObject([
        { functions: { validate: { property1: () => ['failed1'] } } },
        { functions: { validate: { property2: () => ['failed2'] } } },
      ])
      const actual = await instance.functions.validate.object()
      const expected = {
        property1: ['failed1'],
        property2: ['failed2'],
      }
      assert.deepEqual(actual, expected)
    })
    it('should combine functions.validate of two objects correctly', () => {
      const instance = smartObject([
        { functions: { validate: { property1: () => {} } } },
        { functions: { validate: { property2: () => {} } } },
      ])
      assert.isOk(instance.functions.validate.property1)
      assert.isOk(instance.functions.validate.property2)
    })
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
