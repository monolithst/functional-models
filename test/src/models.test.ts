import { randomUUID } from 'crypto'
import {
  ModelDefinition,
  ModelReference,
  ValueRequired,
} from '../../src/interfaces'
import { isPromise } from '../../src/utils'

import sinon from 'sinon'
import { assert } from 'chai'
import { BaseModel } from '../../src/models'
import {
  Property,
  TextProperty,
  UniqueId,
  IntegerProperty,
  ModelReferenceProperty,
} from '../../src/properties'

type TEST_MODEL_TYPE = {
  name: string
}

const TEST_MODEL_1 = BaseModel<TEST_MODEL_TYPE>('MyModel', {
  properties: {
    name: TextProperty(),
  },
})

describe('/src/models.ts', () => {
  describe('#BaseModel()', () => {
    it('should have a Promise for ReferenceValueTypes', () => {
      type ModelType1 = { simple: number }
      const model1 = BaseModel<ModelType1>('TestModel1', {
        properties: {
          simple: IntegerProperty(),
        },
      })
      const instance1 = model1.create({ simple: 10 })
      const model2 = BaseModel<{
        value: number
        value2: ModelReference<ModelType1>
      }>('TestModel2', {
        properties: {
          value: IntegerProperty(),
          value2: ModelReferenceProperty<ModelType1, ValueRequired<ModelType1>>(
            model1
          ),
        },
      })
      const instance2 = model2.create({
        value: 3,
        value2: {
          simple: 5,
        },
      })
      const actual = instance2.get.value2()
      if (isPromise(actual)) {
        assert.isOk(actual.then)
      } else {
        throw new Error(`Not a promise`)
      }
    })
    it('should allow a non-promise number property to be added without await', () => {
      const model = BaseModel<{ value: number; value2: number }>('TestModel', {
        properties: {
          value: IntegerProperty(),
          value2: IntegerProperty<ValueRequired<number>>(),
        },
      })
      const instance = model.create({ value: 3, value2: 4 })
      const number = instance.get.value()
      if (isPromise(number)) {
        throw new Error(`Should not be a promise!`)
      }
      const number2 = instance.get.value2()
      const actual = number + number2
      const expected = 7
      assert.equal(actual, expected)
    })
    it('should provide a Promise for get.id() by default', () => {
      const model = BaseModel<{ value: number }>('TestModel', {
        properties: {
          value: IntegerProperty(),
        },
      })
      const instance = model.create({ value: 3 })
      // @ts-ignore
      const actual = instance.get.id()
      const value = isPromise(actual)
      assert.isOk(value)
    })
    it('should not be a Promise for get.id() if set explicitly', () => {
      const model = BaseModel<{
        id: string
        value: number
        somethingElse: number
      }>('TestModel', {
        properties: {
          id: TextProperty<string>(),
          value: IntegerProperty(),
          somethingElse: IntegerProperty<ValueRequired<number>>(),
        },
      })
      const instance = model.create({ id: 'test', value: 3, somethingElse: 5 })
      const actual = instance.get.id()
      const value = isPromise(actual)
      assert.isFalse(value)
    })
    it('should allow a promise number property to be added, and after an await be added ', async () => {
      const model = BaseModel<{ value: Promise<number>; value2: number }>(
        'TestModel',
        {
          properties: {
            value: IntegerProperty({ lazyLoadMethod: input => input + 5 }),
            value2: IntegerProperty<ValueRequired<number>>(),
          },
        }
      )
      const instance = model.create({ value: 3, value2: 4 })
      const number = await instance.get.value()
      const number2 = instance.get.value2()
      const actual = number + number2
      const expected = 12
      assert.equal(actual, expected)
    })
    describe('#getOptions()', () => {
      it('should pass arbitrary options from the BaseModel() call through to the model', () => {
        const model = BaseModel(
          'ModelName',
          {
            properties: {},
          },
          {
            instanceCreatedCallback: null,
            arbitrary: { nested: 'arg' },
          }
        )
        const options = model.getOptions()
        const actual = options.arbitrary
        const expected = { nested: 'arg' }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getPrimaryKeyName()', () => {
      it('should return "primaryKey" when this value is passed in as the primaryKey', () => {
        const expected = 'primaryKey'
        const model = BaseModel<{}>('ModelName', {
          getPrimaryKeyName: () => expected,
          properties: {},
        })
        const actual = model.getPrimaryKeyName()
        assert.equal(actual, expected)
      })
    })
    describe('#getSingularName()', () => {
      it('should return Model for Models', () => {
        const Models = BaseModel<{ myString: string }>('Models', {
          properties: {
            myString: TextProperty(),
          },
        })
        const actual = Models.getSingularName()
        const expected = 'Model'
        assert.equal(actual, expected)
      })
      it('should return "CustomSingularName" when using the custom singularName', () => {
        const Models = BaseModel<{ myString: string }>('Models', {
          properties: {
            myString: TextProperty(),
          },
          singularName: 'CustomSingularName',
        })
        const actual = Models.getSingularName()
        const expected = 'CustomSingularName'
        assert.equal(actual, expected)
      })
    })
    describe('#getDisplayName()', () => {
      it('should return Models for "models"', () => {
        const Models = BaseModel<{ myString: string }>('models', {
          properties: {
            myString: TextProperty(),
          },
        })
        const actual = Models.getDisplayName()
        const expected = 'Models'
        assert.equal(actual, expected)
      })
      it('should return "Custom Display Name" when using the custom display name', () => {
        const Models = BaseModel<{ myString: string }>('Models', {
          properties: {
            myString: TextProperty(),
          },
          displayName: 'Custom Display Name',
        })
        const actual = Models.getDisplayName()
        const expected = 'Custom Display Name'
        assert.equal(actual, expected)
      })
    })
    describe('#create()', () => {
      /*
      it('should have a references.theReference when properties has a ReferenceProperty named "theReference"', () => {
        const model = BaseModel<{
          theReference?: ReferenceValueType<TEST_MODEL_TYPE>
        }>('ModelName', {
          properties: {
            theReference: ReferenceProperty(TEST_MODEL_1),
          },
        })
        const instance = model.create({})
        assert.isFunction(instance.references.theReference)
      })

       */
      it('should have an "get.id" field when no primaryKey is passed', () => {
        const model = BaseModel<{}>('ModelName', {
          properties: {},
        })
        const instance = model.create({})
        assert.isFunction(instance.get.id)
      })
      it('should have an "getMyPrimaryKeyId" field when "myPrimaryKeyId" is passed as the "getPrimaryKey" is passed', () => {
        const model = BaseModel<{ myPrimaryKeyId: string }>('ModelName', {
          getPrimaryKeyName: () => 'myPrimaryKeyId',
          properties: {
            myPrimaryKeyId: UniqueId(),
          },
        })
        const instance = model.create({ myPrimaryKeyId: 'blah' })
        assert.isFunction(instance.get.myPrimaryKeyId)
      })
      it('should call all the instanceCreatedCallback functions when create() is called', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }
        const callbacks = [sinon.stub(), sinon.stub()]
        const model = BaseModel<{ myProperty: string }>('name', input, {
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
        const model = BaseModel<{ myProperty: string }>('name', input, {
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
        const model = BaseModel<{ myProperty: string }>('name', input)
        assert.doesNotThrow(() => {
          // @ts-ignore
          model.create({})
        })
      })
      it('should not throw an exception if an unsupported property is passed into function', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = BaseModel<{ myProperty: string }>('name', input)
        assert.doesNotThrow(() => {
          // @ts-ignore
          model.create({ whereIsMyProperty: 'not-here' })
        })
      })
      it('should return an object that contains getModel().getModelDefinition().properties.myProperty', () => {
        type MyType = { myProperty: string }
        const input: ModelDefinition<MyType> = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }

        const model = BaseModel<MyType>('name', input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.getModel().getModelDefinition()
          .properties.myProperty
        assert.isOk(actual)
      })
      it('should return an object that contains .getModel().getName()===test-the-name', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = BaseModel<{ myProperty: string }>('test-the-name', input)
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
        const model = BaseModel<{ myProperty: string }>('name', input)
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
        const model = BaseModel<{ myProperty: string }>('name', input)
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
        const model = BaseModel<{ myProperty: string }>('name', input)
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
        const model = BaseModel<{ myProperty: string }>('name', input)
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
        const model = BaseModel<{ myProperty: string | null }>('name', input)
        const instance = model.create({ myProperty: null })
        const actual = instance.get.myProperty()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should return a model with get.id and get.type for the provided valid keyToProperty', () => {
        const input = {
          properties: {
            type: Property('MyProperty', {}),
          },
        }
        const model = BaseModel<{ type: string }>('name', input)
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
        const model = BaseModel('name', input)
        const instance = model.create({ id: expected, type: 'my-type' })
        // @ts-ignore
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
        const model = BaseModel<{ type: string }>('name', input)
        const instance = model.create({ id: expected, type: 'my-type' })
        // @ts-ignore
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
        const model = BaseModel('name', input)
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
        const model = BaseModel('name', input)
        const instance = model.create({ id: 'my-id' })
        const actual = await instance.validate()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
    })
    it('should return an object with a function "create" when called once with valid data', () => {
      const actual = BaseModel<{}>('name', { properties: {} })
      assert.isFunction(actual.create)
    })
    describe('#references.getMyReferencedId()', () => {
      it('should return the id from the ReferenceProperty', () => {
        const model = BaseModel<{
          myReference: ModelReference<TEST_MODEL_TYPE>
        }>('ModelName', {
          properties: {
            myReference: ModelReferenceProperty(TEST_MODEL_1),
          },
        })
        const instance = model.create({ myReference: 'unit-test-id' })
        const actual = instance.references.myReference()
        const expected = 'unit-test-id'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#toObj()', () => {
      it('should be able to pass the results of toObj into .create() without forcing it.', async () => {
        const model = BaseModel<{ simple: string }>('ModelName', {
          properties: { simple: TextProperty() },
        })
        const instance1 = model.create({ simple: 'test-me' })
        const obj = await instance1.toObj()
        const instance2 = model.create(obj)
        const obj2 = await instance2.toObj()
        assert.deepEqual(obj, obj2)
      })
    })
    describe('#getPrimaryKey()', () => {
      it('should return the same id if "toObj()" is called first', async () => {
        const model = BaseModel<{ uuid: string }>('ModelName', {
          getPrimaryKeyName: () => 'uuid',
          properties: {
            uuid: TextProperty({
              lazyLoadMethod: (value: string) => {
                return value || (randomUUID() as string)
              },
            }),
          },
        })
        //@ts-ignore
        const instance = model.create({})
        const expected = await instance.toObj()
        const actual = await instance.getPrimaryKey()
        assert.equal(actual, expected.uuid)
      })
      it('should return the id of a primary key that has a delayed implementation', async () => {
        const model = BaseModel<{ id: string }>('ModelName', {
          properties: {
            id: TextProperty({
              lazyLoadMethod: () => {
                return Promise.resolve().then(() => 'delayed-id')
              },
            }),
          },
        })
        const expected = 'delayed-id'
        //@ts-ignore
        const instance = model.create({})
        const actual = await instance.getPrimaryKey()
        assert.equal(actual, expected)
      })
      it('should return the id field when no primaryKey is passed', async () => {
        const model = BaseModel('ModelName', { properties: {} })
        const expected = 'my-primary-key'
        const instance = model.create({ id: expected })
        const actual = await instance.getPrimaryKey()
        assert.equal(actual, expected)
      })
      it('should return the primaryKey field when "primaryKey" is passed as primaryKey', async () => {
        const model = BaseModel<{ primaryKey: string }>('ModelName', {
          getPrimaryKeyName: () => 'primaryKey',
          properties: {
            primaryKey: TextProperty({ required: true }),
          },
        })
        const expected = 'my-primary-key'
        const instance = model.create({ primaryKey: expected })
        const actual = await instance.getPrimaryKey()
        assert.equal(actual, expected)
      })
    })
  })
})
