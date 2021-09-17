const assert = require('chai').assert
const { createModel } = require('../../src/models')
const { field } = require('../../src/fields')

describe('/src/models.js', () => {
  describe('#createModel()', () => {
    it('should return a function when called once with valid data', () => {
      const actual = createModel({})
      const expected = 'function'
      assert.isFunction(actual)
    })
    describe('#()', () => {
      it('should use the value passed in when field.defaultValue and field.value are not set', async () => {
        const input = {
          myField: field({ required: true }),
        }
        const model = createModel(input)
        const instance = model({ myField: 'passed-in' })
        const actual = await instance.getMyField()
        const expected = 'passed-in'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for field.value when even if field.defaultValue is set and a value is passed in', async () => {
        const input = {
          myField: field({ value: 'value', defaultValue: 'default-value' }),
        }
        const model = createModel(input)
        const instance = model({ myField: 'passed-in' })
        const actual = await instance.getMyField()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for field.value when even if field.defaultValue is not set and a value is passed in', async () => {
        const input = {
          myField: field({ value: 'value' }),
        }
        const model = createModel(input)
        const instance = model({ myField: 'passed-in' })
        const actual = await instance.getMyField()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for field.defaultValue when field.value is not set and no value is passed in', async () => {
        const input = {
          myField: field({ defaultValue: 'defaultValue' }),
        }
        const model = createModel(input)
        const instance = model({})
        const actual = await instance.getMyField()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for field.defaultValue when field.value is not set and null is passed as a value', async () => {
        const input = {
          myField: field({ defaultValue: 'defaultValue' }),
        }
        const model = createModel(input)
        const instance = model({ myField: null })
        const actual = await instance.getMyField()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should return a model with getId and getType for the provided valid keyToField', () => {
        const input = {
          id: field({ required: true }),
          type: field(),
        }
        const model = createModel(input)
        const actual = model({ id: 'my-id', type: 'my-type' })
        assert.isOk(actual.getId)
        assert.isOk(actual.getType)
      })
      it('should return a model where validate returns one error for id', async () => {
        const input = {
          id: field({ required: true }),
          type: field(),
        }
        const model = createModel(input)
        const instance = model({ type: 'my-type' })
        const actual = await instance.functions.validate.model()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
    })
    it('should return a function when called once with valid data', () => {
      const actual = createModel({})
      assert.isFunction(actual)
    })
    it('should throw an exception if a key "model" is passed in', () => {
      assert.throws(() => {
        createModel({ model: 'weeee' })
      })
    })
  })
})
