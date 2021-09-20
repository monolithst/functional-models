const _ = require('lodash')
const sinon = require('sinon')
const assert = require('chai').assert
const { Model } = require('../../src/models')
const { Property } = require('../../src/properties')

describe('/src/models.js', () => {
  describe('#Model()', () => {
    describe('#create()', () => {
      it('should call the instanceCreatedCallback function when create() is called', () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const callback = sinon.stub()
        const model = Model(
          'name',
          input,
          {},
          { instanceCreatedCallback: callback }
        )
        model.create({ myProperty: 'value' })
        sinon.assert.calledOnce(callback)
      })
      it('should not throw an exception if nothing is passed into function', () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const model = Model('name', input)
        assert.doesNotThrow(() => {
          model.create()
        })
      })
      it('should return an object that contains meta.getModel().getProperties().myProperty', () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.meta.getModel().getProperties().myProperty
        assert.isOk(actual)
      })
      it('should return an object that contains meta.getModel().getName()===test-the-name', () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const model = Model('test-the-name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.meta.getModel().getName()
        const expected = 'test-the-name'
        assert.deepEqual(actual, expected)
      })
      it('should return an object that contains meta.getModel().getProperties().myProperty', () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.meta.getModel().getProperties().myProperty
        assert.isOk(actual)
      })
      it('should use the value passed in when Property.defaultValue and Property.value are not set', async () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = await instance.getMyProperty()
        const expected = 'passed-in'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.value when even if Property.defaultValue is set and a value is passed in', async () => {
        const input = {
          myProperty: Property({
            value: 'value',
            defaultValue: 'default-value',
          }),
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = await instance.getMyProperty()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.value when even if Property.defaultValue is not set and a value is passed in', async () => {
        const input = {
          myProperty: Property({ value: 'value' }),
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = await instance.getMyProperty()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.defaultValue when Property.value is not set and no value is passed in', async () => {
        const input = {
          myProperty: Property({ defaultValue: 'defaultValue' }),
        }
        const model = Model('name', input)
        const instance = model.create({})
        const actual = await instance.getMyProperty()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.defaultValue when Property.value is not set and null is passed as a value', async () => {
        const input = {
          myProperty: Property({ defaultValue: 'defaultValue' }),
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: null })
        const actual = await instance.getMyProperty()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should return a model with getId and getType for the provided valid keyToProperty', () => {
        const input = {
          id: Property({ required: true }),
          type: Property(),
        }
        const model = Model('name', input)
        const actual = model.create({ id: 'my-id', type: 'my-type' })
        assert.isOk(actual.getId)
        assert.isOk(actual.getType)
      })
      it('should return a model where validate returns one error for id', async () => {
        const input = {
          id: Property({ required: true }),
          type: Property(),
        }
        const model = Model('name', input)
        const instance = model.create({ type: 'my-type' })
        const actual = await instance.functions.validate.model()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
    })
    it('should return an object with a function "create" when called once with valid data', () => {
      const actual = Model('name', {})
      assert.isFunction(actual.create)
    })
    it('should throw an exception if a key "model" is passed in', () => {
      assert.throws(() => {
        Model('name', { model: 'weeee' }).create()
      })
    })
  })
})
