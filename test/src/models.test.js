const _ = require('lodash')
const sinon = require('sinon')
const assert = require('chai').assert
const { Model } = require('../../src/models')
const { Property, TextProperty, ReferenceProperty } = require('../../src/properties')

const TEST_MODEL_1 = Model('MyModel', )

describe('/src/models.js', () => {
  describe('#Model()', () => {
    it('should pass a functional instance to the instanceFunctions by the time the function is called by a client', () => {
      const model = Model(
        'ModelName',
        {},
        {
          instanceFunctions: {
            func1: instance => () => {
              return instance.functions.func2()
            },
            func2: instance => () => {
              return 'from instance func2'
            },
          },
        }
      )
      const instance = model.create({})
      const actual = instance.functions.func1()
      const expected = 'from instance func2'
      assert.deepEqual(actual, expected)
    })
    it('should the clients arguments before the model is passed', () => {
      const model = Model(
        'ModelName',
        {},
        {
          modelFunctions: {
            func1: (input, model) => {
              return `${input} ${model.func2()}`
            },
            func2: model => {
              return 'from func2'
            },
          },
        }
      )
      const actual = model.func1('hello')
      const expected = 'hello from func2'
      assert.deepEqual(actual, expected)
    })
    it('should pass a functional model to the modelFunction by the time the function is called by a client', () => {
      const model = Model(
        'ModelName',
        {},
        {
          modelFunctions: {
            func1: model => {
              return model.func2()
            },
            func2: model => {
              return 'from func2'
            },
          },
        }
      )
      const actual = model.func1()
      const expected = 'from func2'
      assert.deepEqual(actual, expected)
    })
    it('should find model.myString when modelExtension has myString function in it', () => {
      const model = Model(
        'ModelName',
        {},
        {
          modelFunctions: {
            myString: model => () => {
              return 'To String'
            },
          },
        }
      )
      assert.isFunction(model.myString)
    })
    describe('#getPrimaryKeyName()', () => {
      it('should return "primaryKey" when this value is passed in as the primaryKey', () => {
        const expected = 'primaryKey'
        const model = Model(
          'ModelName',
          {},
          {
            primaryKey: expected,
            modelFunctions: {
              myString: model => () => {
                return 'To String'
              },
            },
          }
        )
        const actual = model.getPrimaryKeyName()
        assert.equal(actual, expected)
      })
    })
    describe('#create()', () => {
      it('should have a meta.references.getTheReferenceId when the property has meta.getReferencedId and the key is theReference', () => {
        const model = Model(
          'ModelName',
          {
            theReference: ReferenceProperty(TEST_MODEL_1),
          },
        )
        const instance = model.create({})
        assert.isFunction(instance.meta.references.getTheReferenceId)
      })
      it('should have an "getId" field when no primaryKey is passed', () => {
        const model = Model(
          'ModelName',
          {},
          {
            instanceFunctions: {
              toString: instance => () => {
                return 'An instance'
              },
            },
          }
        )
        const instance = model.create({})
        assert.isFunction(instance.getId)
      })
      it('should have an "getMyPrimaryKeyId" field when "myPrimaryKeyId" is passed as the "primaryKey" is passed', () => {
        const model = Model(
          'ModelName',
          {},
          {
            primaryKey: 'myPrimaryKeyId',
            instanceFunctions: {
              toString: instance => () => {
                return 'An instance'
              },
            },
          }
        )
        const instance = model.create({})
        assert.isFunction(instance.getMyPrimaryKeyId)
      })
      it('should find instance.functions.toString when in instanceFunctions', () => {
        const model = Model(
          'ModelName',
          {},
          {
            instanceFunctions: {
              toString: instance => () => {
                return 'An instance'
              },
            },
          }
        )
        const instance = model.create({})
        assert.isFunction(instance.functions.toString)
      })
      it('should call the instanceCreatedCallback function when create() is called', () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const callback = sinon.stub()
        const model = Model('name', input, {
          instanceCreatedCallback: callback,
        })
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
      it('should combine the meta within the instance values', () => {
        const input = {
          myProperty: Property({ required: true }),
        }
        const model = Model('name', input)
        const instance = model.create({
          myProperty: 'value',
          meta: { random: () => 'random' },
        })
        const actual = instance.meta.random()
        const expected = 'random'
        assert.equal(actual, expected)
      })
      it('should flow through the additional special functions within the keyValues', () => {
        const input = {
          myProperty: Property({ required: true }),
          functions: {
            custom: () => 'works',
          },
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.functions.custom()
        const expected = 'works'
        assert.equal(actual, expected)
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
        const actual = await instance.functions.validate()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
      it('should return a model where validate returns one error for the missing text property', async () => {
        const input = {
          id: Property({ required: true }),
          text: TextProperty({required: true}),
        }
        const model = Model('name', input)
        const instance = model.create({ id: 'my-id' })
        const actual = await instance.functions.validate()
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
    describe('#meta.references.getMyReferencedId()', () => {
      it('should return the id from the ReferenceProperty', () => {
        const model = Model(
          'ModelName',
          {
            myReference: ReferenceProperty(TEST_MODEL_1),
          },
        )
        const instance = model.create({ myReference: 'unit-test-id' })
        const actual = instance.meta.references.getMyReferenceId()
        const expected = 'unit-test-id'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#functions.getPrimaryKey()', () => {
      it('should return the id field when no primaryKey is passed', async () => {
        const model = Model(
          'ModelName',
          {},
          {
            instanceFunctions: {
              toString: instance => () => {
                return 'An instance'
              },
            },
          }
        )
        const expected = 'my-primary-key'
        const instance = model.create({ id: expected })
        const actual = await instance.functions.getPrimaryKey()
        assert.equal(actual, expected)
      })
      it('should return the primaryKey field when "primaryKey" is passed as primaryKey', async () => {
        const model = Model(
          'ModelName',
          {},
          {
            primaryKey: 'primaryKey',
            instanceFunctions: {
              toString: instance => () => {
                return 'An instance'
              },
            },
          }
        )
        const expected = 'my-primary-key'
        const instance = model.create({ primaryKey: expected })
        const actual = await instance.functions.getPrimaryKey()
        assert.equal(actual, expected)
      })
    })
  })
})
