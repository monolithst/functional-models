import {
  ModelDefinition,
  ModelReference,
  ModelMethod,
  ModelInstanceMethod,
  ModelInstance,
  ValueRequired,
  IsAsync,
  ModelMethodGetters,
  Model,
  FunctionalModel,
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
import { WrapperInstanceMethod, WrapperModelMethod } from '../../src/methods'

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
    it('should be able to use a custom Model<> type for a ModelMethod, so long as you override the methods.', async () => {
      type MyModel<T extends FunctionalModel> = Model<T> & {
        methods: ModelMethodGetters<T, MyModel<T>>
        extended: () => string
      }

      type ModelType = {
        simple: number
        myMethod: ModelMethod<ModelType, MyModel<ModelType>>
      }
      const model1 = BaseModel<ModelType>('TestModel1', {
        properties: {
          simple: IntegerProperty(),
        },
        modelMethods: {
          myMethod: WrapperModelMethod<ModelType, MyModel<ModelType>>(
            (model: MyModel<ModelType>, value: string) => {
              return `hello ${value}`
            }
          ),
        },
      }) as MyModel<ModelType>
      const actual = await model1.methods.myMethod('world')
      const expected = 'hello world'
      assert.deepEqual(actual, expected)
    })
    it('should be able to use a custom ModelInstance<> type for a ModelMethod and ModelMethodInstance', async () => {
      type MyModelInstance<T extends FunctionalModel> = ModelInstance<T> & {
        extended: () => string
      }
      type ModelType = {
        simple: number
        myMethod: ModelMethod<ModelType, Model<ModelType>>
        myInstanceMethod: ModelInstanceMethod<
          ModelType,
          Model<ModelType>,
          MyModelInstance<ModelType>
        >
      }
      const model1 = BaseModel<ModelType>('TestModel1', {
        properties: {
          simple: IntegerProperty(),
        },
        modelMethods: {
          myMethod: (model: Model<ModelType>, value: string) => {
            return `hello ${value}`
          },
        },
        instanceMethods: {
          myInstanceMethod: (
            instance: MyModelInstance<ModelType>,
            model: Model<ModelType>,
            value: string
          ) => {
            return `hello ${value}`
          },
        },
      })
      const actual = await model1.methods.myMethod('world')
      const expected = 'hello world'
      assert.deepEqual(actual, expected)

      const instance1 = model1.create({
        simple: 10,
      }) as MyModelInstance<ModelType>
      const actual2 = await instance1.methods.myInstanceMethod('world')
      const expected2 = 'hello world'
      assert.deepEqual(actual2, expected2)
    })
    it('should be able to use a custom ModelInstance<> type for a ModelMethod', async () => {
      type MyModelInstance<T extends FunctionalModel> = ModelInstance<T> & {
        extended: () => string
      }
      type ModelType = {
        simple: number
        myMethod: ModelMethod<ModelType, Model<ModelType>>
      }
      const model1 = BaseModel<ModelType>('TestModel1', {
        properties: {
          simple: IntegerProperty(),
        },
        modelMethods: {
          myMethod: (model: Model<ModelType>, value: string) => {
            return `hello ${value}`
          },
        },
      })
      const actual = await model1.methods.myMethod('world')
      const expected = 'hello world'
      assert.deepEqual(actual, expected)
    })
    it('should be able to use a custom ModelInstance<> type for a ModelInstanceMethod', async () => {
      type MyModelInstance<T extends FunctionalModel> = ModelInstance<T> & {
        extended: () => string
      }
      type ModelType = {
        simple: number
        myInstanceMethod: ModelInstanceMethod<
          ModelType,
          Model<ModelType>,
          MyModelInstance<ModelType>
        >
      }
      const model1 = BaseModel<ModelType>('TestModel1', {
        properties: {
          simple: IntegerProperty(),
        },
        instanceMethods: {
          myInstanceMethod: (
            instance: MyModelInstance<ModelType>,
            model: Model<ModelType>,
            value: string
          ) => {
            return `hello ${value}`
          },
        },
      })
      const instance1 = model1.create({ simple: 10 })
      const actual = await instance1.methods.myInstanceMethod('world')
      const expected = 'hello world'
      assert.deepEqual(actual, expected)
    })
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
      const instance2 = model2.create({ value: 3, value2: instance1 })
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
    it('should pass a functional instance to the instanceMethods by the time the function is called by a client', () => {
      const model = BaseModel<{
        name: string
        func1: ModelInstanceMethod
        func2: ModelInstanceMethod
      }>('ModelName', {
        properties: {
          name: TextProperty(),
        },
        instanceMethods: {
          func1: WrapperInstanceMethod(
            (instance: ModelInstance<any>, model) => {
              return instance.methods.func2()
            }
          ),
          func2: (instance: ModelInstance<any>, model) => {
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
      type MyType = { func1: ModelMethod<MyType>; func2: ModelMethod<MyType> }
      const model = BaseModel<MyType>('ModelName', {
        properties: {},
        modelMethods: {
          func1: WrapperModelMethod<MyType>((model, input) => {
            return `${input} ${model.methods.func2()}`
          }),
          func2: WrapperModelMethod<MyType>(model => {
            return 'from func2'
          }),
        },
      })
      const actual = model.methods.func1('hello')
      const expected = 'hello from func2'
      assert.deepEqual(actual, expected)
    })
    it('should pass a functional model to the modelFunction by the time the function is called by a client', () => {
      type MyType = { func1: ModelMethod<MyType>; func2: ModelMethod<MyType> }
      const model = BaseModel<MyType>('ModelName', {
        properties: {},
        modelMethods: {
          func1: model => {
            return model.methods.func2()
          },
          func2: model => {
            return 'from func2'
          },
        },
      })
      const actual = model.methods.func1()
      const expected = 'from func2'
      assert.deepEqual(actual, expected)
    })
    it('should find model.myString when modelExtension has myString function in it', () => {
      const model = BaseModel<{ myString: ModelMethod }>('ModelName', {
        properties: {},
        modelMethods: {
          myString: model => {
            return 'To String'
          },
        },
      })
      assert.isFunction(model.methods.myString)
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
        const model = BaseModel<{ myString: ModelMethod }>('ModelName', {
          getPrimaryKeyName: () => expected,
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
      it('should find instance.methods.toString when in instanceMethods', () => {
        const model = BaseModel<{ toString: ModelInstanceMethod }>(
          'ModelName',
          {
            properties: {},
            instanceMethods: {
              toString: instance => {
                return 'An instance'
              },
            },
          }
        )
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
      it('should flow through the additional special functions within the keyValues', () => {
        const input = {
          properties: {
            myProperty: TextProperty({ required: true }),
          },
          instanceMethods: {
            custom: () => 'works',
          },
        }
        const model = BaseModel<{
          myProperty: string
          custom: ModelInstanceMethod
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
      it('should return the id of a primary key that has a delayed implementation', async () => {
        const model = BaseModel<{id: string}>('ModelName', { 
          properties: {
            id: TextProperty({ lazyLoadMethod: () => {
              return Promise.resolve()
                .then(() => 'delayed-id')
            }})
          }
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
            primaryKey: TextProperty({ required: true })
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
