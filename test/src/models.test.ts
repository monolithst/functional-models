import {
  IModelDefinition,
  IPropertyInstance,
  ReferenceValueType,
  IModelMethod,
  IModel,
  IModelInstanceMethod,
  IModelInstance,
  IModelInstanceMethodTyped,
  Arrayable,
  FunctionalType,
} from '../../src/interfaces'

import _ from 'lodash'
import sinon from 'sinon'
import { assert } from 'chai'
import { Model } from '../../src/models'
import { Property, TextProperty, ReferenceProperty } from '../../src/properties'
import { InstanceMethod, ModelMethod } from '../../src/methods'
import { UniqueId } from '../../src/properties'

type TEST_MODEL_TYPE = {
  name: string
}

const TEST_MODEL_1 = Model<TEST_MODEL_TYPE>('MyModel', {
  properties: {
    name: TextProperty(),
  },
})

describe('/src/models.ts', () => {
  describe('#Model()', () => {
    it('should pass a functional instance to the instanceMethods by the time the function is called by a client', () => {
      const model = Model<{
        name: string
        func1: IModelInstanceMethod
        func2: IModelInstanceMethod
      }>('ModelName', {
        properties: {
          name: TextProperty(),
        },
        instanceMethods: {
          func1: InstanceMethod((instance: IModelInstance<any>) => {
            // @ts-ignore
            return instance.methods.func2()
          }),
          func2: (instance: IModelInstance<any>) => {
            return 'from instance func2'
          },
        },
      })
      const instance = model.create({ name: 'name' })
      const actual = instance.methods.func1()
      const expected = 'from instance func2'
      assert.deepEqual(actual, expected)
    })
    it('should pass the clients arguments before the model is passed', () => {
      const model = Model<{ func1: IModelMethod; func2: IModelMethod }>(
        'ModelName',
        {
          properties: {},
          modelMethods: {
            func1: ModelMethod((model, input) => {
              return `${input} ${model.methods.func2()}`
            }),
            func2: ModelMethod(model => {
              return 'from func2'
            }),
          },
        }
      )
      const actual = model.methods.func1('hello')
      const expected = 'hello from func2'
      assert.deepEqual(actual, expected)
    })
    it('should pass a functional model to the modelFunction by the time the function is called by a client', () => {
      const model = Model<{ func1: IModelMethod; func2: IModelMethod }>(
        'ModelName',
        {
          properties: {},
          modelMethods: {
            func1: model => {
              return model.methods.func2()
            },
            func2: model => {
              return 'from func2'
            },
          },
        }
      )
      const actual = model.methods.func1()
      const expected = 'from func2'
      assert.deepEqual(actual, expected)
    })
    it('should find model.myString when modelExtension has myString function in it', () => {
      const model = Model<{ myString: IModelMethod }>('ModelName', {
        properties: {},
        modelMethods: {
          myString: model => {
            return 'To String'
          },
        },
      })
      assert.isFunction(model.methods.myString)
    })
    describe('#getPrimaryKeyName()', () => {
      it('should return "primaryKey" when this value is passed in as the primaryKey', () => {
        const expected = 'primaryKey'
        const model = Model<{ myString: IModelMethod }>('ModelName', {
          getPrimaryKey: () => expected,
          properties: {},
          modelMethods: {
            myString: model => {
              return 'To String'
            },
          },
        })
        const actual = model.getPrimaryKeyName()
        assert.equal(actual, expected)
      })
    })
    describe('#create()', () => {
      it('should have a references.theReference when properties has a ReferenceProperty named "theReference"', () => {
        const model = Model<{
          theReference?: ReferenceValueType<TEST_MODEL_TYPE>
        }>('ModelName', {
          properties: {
            theReference: ReferenceProperty(TEST_MODEL_1),
          },
        })
        const instance = model.create({})
        assert.isFunction(instance.references.theReference)
      })
      it('should have an "get.id" field when no primaryKey is passed', () => {
        const model = Model<{}>('ModelName', {
          properties: {},
        })
        const instance = model.create({})
        assert.isFunction(instance.get.id)
      })
      it('should have an "getMyPrimaryKeyId" field when "myPrimaryKeyId" is passed as the "getPrimaryKey" is passed', () => {
        const model = Model<{ myPrimaryKeyId: string }>('ModelName', {
          getPrimaryKey: () => 'myPrimaryKeyId',
          properties: {
            myPrimaryKeyId: UniqueId(),
          },
        })
        const instance = model.create({ myPrimaryKeyId: 'blah' })
        assert.isFunction(instance.get.myPrimaryKeyId)
      })
      it('should find instance.methods.toString when in instanceMethods', () => {
        const model = Model<{ toString: IModelInstanceMethod }>('ModelName', {
          properties: {},
          instanceMethods: {
            toString: instance => {
              return 'An instance'
            },
          },
        })
        const instance = model.create({})
        assert.isFunction(instance.methods.toString)
      })
      it('should call all the instanceCreatedCallback functions when create() is called', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }
        const callbacks = [sinon.stub(), sinon.stub()]
        const model = Model('name', input, {
          instanceCreatedCallback: callbacks,
        })
        model.create({ myProperty: 'value' })
        callbacks.forEach(x => {
          sinon.assert.calledOnce(x)
        })
      })
      it('should call the instanceCreatedCallback function when create() is called', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
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
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = Model('name', input)
        assert.doesNotThrow(() => {
          model.create({})
        })
      })
      it('should return an object that contains getModel().getModelDefinition().properties.myProperty', () => {
        type MyType = { myProperty: string }
        const input: IModelDefinition<MyType> = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }

        const model = Model<MyType>('name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.getModel().getModelDefinition()
          .properties.myProperty
        assert.isOk(actual)
      })
      it('should flow through the additional special functions within the keyValues', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
          instanceMethods: {
            custom: () => 'works',
          },
        }
        const model = Model<{
          myProperty: string
          custom: IModelInstanceMethod
        }>('name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.methods.custom()
        const expected = 'works'
        assert.equal(actual, expected)
      })
      it('should return an object that contains .getModel().getName()===test-the-name', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = Model('test-the-name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.getModel().getName()
        const expected = 'test-the-name'
        assert.deepEqual(actual, expected)
      })
      it('should use the value passed in when Property.defaultValue and Property.value are not set', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = Model<{ myProperty: string }>('name', input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = instance.get.myProperty()
        const expected = 'passed-in'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.value when even if Property.defaultValue is set and a value is passed in', () => {
        const input = {
          properties: {
            myProperty: Property('MyProperty', {
              value: 'value',
              defaultValue: 'default-value',
            }),
          },
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = instance.get.myProperty()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.value when even if Property.defaultValue is not set and a value is passed in', async () => {
        const input = {
          properties: {
            myProperty: Property('MyProperty', { value: 'value' }),
          },
        }
        const model = Model<{ myProperty: string }>('name', input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = instance.get.myProperty()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.defaultValue when Property.value is not set and no value is passed in', async () => {
        const input = {
          properties: {
            myProperty: Property('MyProperty', {
              defaultValue: 'defaultValue',
            }),
          },
        }
        const model = Model<{ myProperty: string }>('name', input)
        // @ts-ignore
        const instance = model.create({})
        const actual = instance.get.myProperty()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.defaultValue when Property.value is not set and null is passed as a value', async () => {
        const input = {
          properties: {
            myProperty: Property('MyProperty', {
              defaultValue: 'defaultValue',
            }),
          },
        }
        const model = Model('name', input)
        const instance = model.create({ myProperty: null })
        const actual = instance.get.myProperty()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should return a model with get.id and get.type for the provided valid keyToProperty', () => {
        const input = {
          properties: {
            id: UniqueId({ required: true }),
            type: Property('MyProperty', {}),
          },
        }
        const model = Model('name', input)
        const actual = model.create({ id: 'my-id', type: 'my-type' })
        assert.isOk(actual.get.id)
        assert.isOk(actual.get.type)
      })
      it('should return the id when get.id() is called', () => {
        const expected = 'my-id'
        const input = {
          properties: {
            id: Property<string>('myid', {}),
            type: Property('MyProperty', {}),
          },
        }
        const model = Model('name', input)
        const instance = model.create({ id: expected, type: 'my-type' })
        const actual = instance.get.id()
        assert.equal(actual, expected)
      })
      it('should have a Promise for the default get.id()', () => {
        const expected = 'my-id'
        const input = {
          properties: {
            type: Property('MyProperty', {}),
          },
        }
        const model = Model('name', input)
        const instance = model.create({ id: expected, type: 'my-type' })
        const actual = instance.get.id()
        // @ts-ignore
        assert.isOk(actual.then)
      })
      it('should return a model where validate returns one error for id', async () => {
        const input = {
          properties: {
            id: Property<string>('MyId', { required: true }),
            type: Property('MyProperty', {}),
          },
        }
        const model = Model('name', input)
        const instance = model.create({ type: 'my-type' })
        const actual = await instance.validate()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
      it('should return a model where validate returns one error for the missing text property', async () => {
        const input = {
          properties: {
            id: Property<string>('MyProperty', { required: true }),
            text: TextProperty({ required: true }),
          },
        }
        const model = Model('name', input)
        const instance = model.create({ id: 'my-id' })
        const actual = await instance.validate()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
    })
    it('should return an object with a function "create" when called once with valid data', () => {
      const actual = Model<{}>('name', { properties: {} })
      assert.isFunction(actual.create)
    })
    describe('#references.getMyReferencedId()', () => {
      it('should return the id from the ReferenceProperty', () => {
        const model = Model<{
          myReference: ReferenceValueType<TEST_MODEL_TYPE>
        }>('ModelName', {
          properties: {
            myReference: ReferenceProperty(TEST_MODEL_1),
          },
        })
        const instance = model.create({ myReference: 'unit-test-id' })
        const actual = instance.references.myReference()
        const expected = 'unit-test-id'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getPrimaryKey()', () => {
      it('should return the id field when no primaryKey is passed', async () => {
        const model = Model('ModelName', { properties: {} })
        const expected = 'my-primary-key'
        const instance = model.create({ id: expected })
        const actual = await instance.getPrimaryKey()
        assert.equal(actual, expected)
      })
      it('should return the primaryKey field when "primaryKey" is passed as primaryKey', async () => {
        const model = Model('ModelName', {
          getPrimaryKey: () => 'primaryKey',
          properties: {},
        })
        const expected = 'my-primary-key'
        const instance = model.create({ primaryKey: expected })
        const actual = await instance.getPrimaryKey()
        assert.equal(actual, expected)
      })
    })
  })
})
