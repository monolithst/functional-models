import { randomUUID } from 'crypto'
import {
  ApiInfo,
  MinimalModelDefinition,
  ModelReference,
} from '../../src/types'
import { isPromise } from '../../src/utils'

import sinon from 'sinon'
import { assert } from 'chai'
import { Model, isNullRestInfo } from '../../src/models'
import {
  Property,
  TextProperty,
  IntegerProperty,
  ModelReferenceProperty,
  PrimaryKeyUuidProperty,
} from '../../src/properties'

type TEST_MODEL_TYPE = {
  id: string
  name: string
}

const TEST_MODEL_1 = Model<TEST_MODEL_TYPE>({
  pluralName: 'MyModels',
  namespace: 'functional-models',
  properties: {
    id: PrimaryKeyUuidProperty(),
    name: TextProperty(),
  },
})

describe('/src/models.ts', () => {
  describe('#isNullRestInfo()', () => {
    it('should return true, if the values are the null values', () => {
      const actual = isNullRestInfo({
        method: 'head',
        endpoint: 'NULL',
        security: {},
      })
      assert.isTrue(actual)
    })
    it('should return false, if the values are HEAD and no endpoint', () => {
      const actual = isNullRestInfo({
        method: 'head',
        endpoint: '',
        security: {},
      })
      assert.isFalse(actual)
    })
    it('should return false, if the values are normal values', () => {
      const actual = isNullRestInfo({
        method: 'get',
        endpoint: '/my/endpoint',
        security: {},
      })
      assert.isFalse(actual)
    })
  })
  describe('#Model()', () => {
    it('should throw an exception if an pluralName is not provided', () => {
      type ModelType1 = { id: string; simple: number }
      assert.throws(() => {
        // @ts-ignore
        Model<ModelType1>({
          //pluralName: 'TestModel1',
          namespace: 'functional-models',
          // @ts-ignore
          properties: {
            id: PrimaryKeyUuidProperty(),
            simple: IntegerProperty(),
          },
        })
      }, 'Must include pluralName for model.')
    })
    it('should throw an exception if an namespace is not provided', () => {
      type ModelType1 = { id: string; simple: number }
      assert.throws(() => {
        // @ts-ignore
        Model<ModelType1>({
          pluralName: 'TestModel1',
          //namespace: 'functional-models',
          // @ts-ignore
          properties: {
            id: PrimaryKeyUuidProperty(),
            simple: IntegerProperty(),
          },
        })
      }, 'Must include namespace for model')
    })
    it('should throw an exception if an id property is not provided', () => {
      type ModelType1 = { id: string; simple: number }
      assert.throws(() => {
        Model<ModelType1>({
          pluralName: 'TestModel1',
          namespace: 'functional-models',
          // @ts-ignore
          properties: {
            //id: PrimaryKeyUuidProperty(),
            simple: IntegerProperty(),
          },
        })
      })
    })
    it('should throw an exception if customPrimaryKey is not provided', () => {
      type ModelType1 = { customPrimaryKey: string; simple: number }
      assert.throws(() => {
        Model<ModelType1>({
          pluralName: 'TestModel1',
          namespace: 'functional-models',
          primaryKeyName: 'customPrimaryKey',
          properties: {
            id: PrimaryKeyUuidProperty(),
            simple: IntegerProperty(),
            // missing customPrimaryKey'
          },
        })
      })
    })
    it('should NOT throw an exception if customPrimaryKey is is provided', () => {
      type ModelType1 = { customPrimaryKey: string; simple: number }
      assert.doesNotThrow(() => {
        Model<ModelType1>({
          pluralName: 'TestModel1',
          namespace: 'functional-models',
          primaryKeyName: 'customPrimaryKey',
          properties: {
            customPrimaryKey: PrimaryKeyUuidProperty(),
            simple: IntegerProperty(),
          },
        })
      })
    })
    it('should have a Promise for ReferenceValueTypes', () => {
      type ModelType1 = { id: string; simple: number }
      const model1 = Model<ModelType1>({
        pluralName: 'TestModel1',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          simple: IntegerProperty(),
        },
      })
      const instance1 = model1.create({ id: '123', simple: 10 })
      const model2 = Model<{
        id: string
        value: number
        value2: ModelReference<ModelType1>
      }>({
        pluralName: 'TestModel2',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          value: IntegerProperty(),
          value2: ModelReferenceProperty<ModelType1, ValueRequired<ModelType1>>(
            model1
          ),
        },
      })
      const instance2 = model2.create<'id'>({
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
      const model = Model<{ id: string; value: number; value2: number }>({
        pluralName: 'TestModel',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          value: IntegerProperty(),
          value2: IntegerProperty<ValueRequired<number>>(),
        },
      })
      const instance = model.create<'id'>({ value: 3, value2: 4 })
      const number = instance.get.value()
      if (isPromise(number)) {
        throw new Error(`Should not be a promise!`)
      }
      const number2 = instance.get.value2()
      const actual = number + number2
      const expected = 7
      assert.equal(actual, expected)
    })
    it('should not be a Promise for get.id() if set explicitly', () => {
      const model = Model<{
        id: string
        value: number
        somethingElse: number
      }>({
        pluralName: 'TestModel',
        namespace: 'functional-models',
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
      const model = Model<{
        id: string
        value: Promise<number>
        value2: number
      }>({
        pluralName: 'TestModel',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          value: IntegerProperty({ lazyLoadMethod: input => input + 5 }),
          value2: IntegerProperty<ValueRequired<number>>(),
        },
      })
      const instance = model.create<'id'>({ value: 3, value2: 4 })
      const number = await instance.get.value()
      const number2 = instance.get.value2()
      const actual = number + number2
      const expected = 12
      assert.equal(actual, expected)
    })
    describe('#getValidators()', () => {
      it('should return an array of validators that were passed in', async () => {
        const myValidator = sinon.stub().returns('from validator')
        const model = Model({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty({
              validators: [myValidator],
            }),
          },
        })
        // @ts-ignore
        const instance = model.create({})
        // @ts-ignore
        const actual = await instance.getValidators().id()
        const expected = ['from validator']
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getModelDefinition()', () => {
      it('should return "primaryKey" when this value is passed in as the primaryKey', () => {
        const expected = 'primaryKey'
        const model = Model({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          primaryKeyName: 'primaryKey',
          properties: {
            primaryKey: PrimaryKeyUuidProperty(),
          },
        })
        const actual = model.getModelDefinition().primaryKeyName
        assert.equal(actual, expected)
      })
      describe('#singularName', () => {
        it('should return Model for Models', () => {
          const Models = Model<{ id: string; myString: string }>({
            pluralName: 'Models',
            namespace: 'functional-models',
            properties: {
              id: PrimaryKeyUuidProperty(),
              myString: TextProperty(),
            },
          })
          const actual = Models.getModelDefinition().singularName
          const expected = 'Model'
          assert.equal(actual, expected)
        })
        it('should return "CustomSingularName" when using the custom singularName', () => {
          const Models = Model<{ id: string; myString: string }>({
            pluralName: 'ModelName',
            namespace: 'functional-models',
            properties: {
              id: PrimaryKeyUuidProperty(),
              myString: TextProperty(),
            },
            singularName: 'CustomSingularName',
          })
          const actual = Models.getModelDefinition().singularName
          const expected = 'CustomSingularName'
          assert.equal(actual, expected)
        })
      })
      describe('#displayName', () => {
        it('should return Models for "models"', () => {
          const Models = Model<{ id: string; myString: string }>({
            pluralName: 'Models',
            namespace: 'functional-models',
            properties: {
              id: PrimaryKeyUuidProperty(),
              myString: TextProperty(),
            },
          })
          const actual = Models.getModelDefinition().displayName
          const expected = 'Models'
          assert.equal(actual, expected)
        })
        it('should return "Custom Display Name" when using the custom display name', () => {
          const Models = Model<{ id: string; myString: string }>({
            pluralName: 'Models',
            namespace: 'functional-models',
            properties: {
              id: PrimaryKeyUuidProperty(),
              myString: TextProperty(),
            },
            displayName: 'Custom Display Name',
          })
          const actual = Models.getModelDefinition().displayName
          const expected = 'Custom Display Name'
          assert.equal(actual, expected)
        })
      })
    })
    describe('#create()', () => {
      /*
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

       */
      it('should have an "getMyPrimaryKeyId" field when "myPrimaryKeyId" is passed as the "getPrimaryKey" is passed', () => {
        const model = Model<{ myPrimaryKeyId: string }>({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          primaryKeyName: 'myPrimaryKeyId',
          properties: {
            myPrimaryKeyId: PrimaryKeyUuidProperty(),
          },
        })
        const instance = model.create({ myPrimaryKeyId: 'blah' })
        assert.isFunction(instance.get.myPrimaryKeyId)
      })
      it('should call all the instanceCreatedCallback functions when create() is called', () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: TextProperty({ required: true }),
          },
        }
        const callbacks = [sinon.stub(), sinon.stub()]
        const model = Model<{ id: string; myProperty: string }>(input, {
          instanceCreatedCallback: callbacks,
        })
        model.create<'id'>({ myProperty: 'value' })
        callbacks.forEach(x => {
          sinon.assert.calledOnce(x)
        })
      })
      it('should call the instanceCreatedCallback function when create() is called', () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: TextProperty({ required: true }),
          },
        }
        const callback = sinon.stub()
        const model = Model<{ myProperty: string }>(input, {
          instanceCreatedCallback: callback,
        })
        model.create({ myProperty: 'value' })
        sinon.assert.calledOnce(callback)
      })
      it('should not throw an exception if nothing is passed into function', () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = Model<{ myProperty: string }>(input)
        assert.doesNotThrow(() => {
          // @ts-ignore
          model.create({})
        })
      })
      it('should not throw an exception if an unsupported property is passed into function', () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = Model<{ myProperty: string }>(input)
        assert.doesNotThrow(() => {
          // @ts-ignore
          model.create({ whereIsMyProperty: 'not-here' })
        })
      })
      it('should return an object that contains getModel().getModelDefinition().properties.myProperty', () => {
        type MyType = { id: string; myProperty: string }
        const input: MinimalModelDefinition<MyType> = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: TextProperty({ required: true }),
          },
        }

        const model = Model<MyType>(input)
        const instance = model.create<'id'>({ myProperty: 'value' })
        const actual = instance.getModel().getModelDefinition()
          .properties.myProperty
        assert.isOk(actual)
      })
      it('should return an object that contains .getModel().getName()===functional-models-test-the-name', () => {
        const input = {
          pluralName: 'test-the-name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = Model<{ myProperty: string }>(input)
        const instance = model.create({ myProperty: 'value' })
        const actual = instance.getModel().getName()
        const expected = 'functional-models-test-the-name'
        assert.deepEqual(actual, expected)
      })
      it('should use the value passed in when Property.defaultValue and Property.value are not set', () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: TextProperty({ required: true }),
          },
        }
        const model = Model<{ myProperty: string }>(input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = instance.get.myProperty()
        const expected = 'passed-in'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.value when even if Property.defaultValue is set and a value is passed in', () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: Property('MyProperty', {
              value: 'value',
              defaultValue: 'default-value',
            }),
          },
        }
        const model = Model<{ myProperty: string }>(input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = instance.get.myProperty()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.value when even if Property.defaultValue is not set and a value is passed in', async () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: Property('MyProperty', { value: 'value' }),
          },
        }
        const model = Model<{ myProperty: string }>(input)
        const instance = model.create({ myProperty: 'passed-in' })
        const actual = instance.get.myProperty()
        const expected = 'value'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.defaultValue when Property.value is not set and no value is passed in', async () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: Property('MyProperty', {
              defaultValue: 'defaultValue',
            }),
          },
        }
        const model = Model<{ myProperty: string }>(input)
        // @ts-ignore
        const instance = model.create({})
        const actual = instance.get.myProperty()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should use the value for Property.defaultValue when Property.value is not set and null is passed as a value', async () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myProperty: Property('MyProperty', {
              defaultValue: 'defaultValue',
            }),
          },
        }
        const model = Model<{ myProperty: string | null }>(input)
        const instance = model.create({ myProperty: null })
        const actual = instance.get.myProperty()
        const expected = 'defaultValue'
        assert.deepEqual(actual, expected)
      })
      it('should return a model with get.id and get.type for the provided valid keyToProperty', () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            type: Property('MyProperty', {}),
          },
        }
        const model = Model<{ id: string; type: string }>(input)
        const actual = model.create({ id: 'my-id', type: 'my-type' })
        assert.isOk(actual.get.id)
        assert.isOk(actual.get.type)
      })
      it('should return the id when get.id() is called', () => {
        const expected = 'my-id'
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: Property<string>('myid', {}),
            type: Property('MyProperty', {}),
          },
        }
        const model = Model(input)
        const instance = model.create({ id: expected, type: 'my-type' })
        // @ts-ignore
        const actual = instance.get.id()
        assert.equal(actual, expected)
      })
      it('should have a Promise for the get.id()', () => {
        const expected = 'my-id'
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: TextProperty({
              lazyLoadMethodAtomic: () => Promise.resolve(expected),
            }),
            type: Property('MyProperty', {}),
          },
        }
        const model = Model<{
          id: Promise<string>
          type: string
        }>(input)
        const instance = model.create({ id: expected, type: 'my-type' })
        const actual = instance.get.id()
        assert.isOk(actual.then)
      })
      it('should return a model where validate returns one error for id', async () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: Property<string>('MyId', { required: true }),
            type: Property('MyProperty', {}),
          },
        }
        const model = Model(input)
        const instance = model.create({ type: 'my-type' })
        const actual = await instance.validate()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
      it('should return a model where validate returns one error for the missing text property', async () => {
        const input = {
          pluralName: 'name',
          namespace: 'functional-models',
          properties: {
            id: Property<string>('MyProperty', { required: true }),
            text: TextProperty({ required: true }),
          },
        }
        const model = Model(input)
        const instance = model.create({ id: 'my-id' })
        const actual = await instance.validate()
        const expected = 1
        assert.equal(Object.values(actual).length, expected)
      })
    })
    it('should return an object with a function "create" when called once with valid data', () => {
      const actual = Model<{ id: string }>({
        pluralName: 'name',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
        },
      })
      assert.isFunction(actual.create)
    })
    describe('#getReferences().getMyReferencedId()', () => {
      it('should return the id from the ReferenceProperty', () => {
        const model = Model<{
          id: string
          myReference: ModelReference<TEST_MODEL_TYPE>
        }>({
          pluralName: 'modelName',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            myReference: ModelReferenceProperty(TEST_MODEL_1),
          },
        })
        const instance = model.create<'id'>({ myReference: 'unit-test-id' })
        const actual = instance.getReferences().myReference()
        const expected = 'unit-test-id'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#toObj()', () => {
      it('should be able to pass the results of toObj into .create() without forcing it.', async () => {
        const model = Model<{ id: string; simple: string }>({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            simple: TextProperty(),
          },
        })
        const instance1 = model.create<'id'>({ simple: 'test-me' })
        const obj = await instance1.toObj()
        const instance2 = model.create(obj)
        const obj2 = await instance2.toObj()
        assert.deepEqual(obj, obj2)
      })
    })
    describe('#getPrimaryKey()', () => {
      it('should return the same id if "toObj()" is called first', async () => {
        const model = Model<{ uuid: string }>({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          primaryKeyName: 'uuid',
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
        const model = Model<{ id: string }>({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          properties: {
            id: TextProperty({
              lazyLoadMethodAtomic: () => {
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
        const model = Model({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
          },
        })
        const expected = 'my-primary-key'
        const instance = model.create({ id: expected })
        const actual = await instance.getPrimaryKey()
        assert.equal(actual, expected)
      })
      it('should return the primaryKey field when "primaryKey" is passed as primaryKey', async () => {
        const model = Model<{ primaryKey: string }>({
          pluralName: 'ModelName',
          namespace: 'functional-models',
          primaryKeyName: 'primaryKey',
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
    describe('#getApiInfo()', () => {
      it('should create a full ApiInfo from a partial ApiInfo', () => {
        const model = Model<{ id: string; name: string }>({
          pluralName: 'Models',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
          api: {
            rest: {
              create: {
                endpoint: '/different',
                method: 'patch',
                security: {
                  whatever: ['you', 'want'],
                },
              },
            },
          },
        })
        const actual = model.getApiInfo()
        const expected: ApiInfo = {
          onlyPublish: [],
          noPublish: false,
          createOnlyOne: false,
          rest: {
            create: {
              endpoint: '/different',
              method: 'patch',
              security: {
                whatever: ['you', 'want'],
              },
            },
            retrieve: {
              endpoint: '/functional-models/models/:id',
              method: 'get',
              security: {},
            },
            update: {
              endpoint: '/functional-models/models/:id',
              method: 'put',
              security: {},
            },
            delete: {
              endpoint: '/functional-models/models/:id',
              method: 'delete',
              security: {},
            },
            search: {
              endpoint: '/functional-models/models/search',
              method: 'post',
              security: {},
            },
          },
        }
        assert.deepEqual(actual, expected)
      })
    })
  })
})
