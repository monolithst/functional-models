import { assert } from 'chai'
import chai from 'chai'
import sinon from 'sinon'
import { UTCDate } from '@date-fns/utc'
import asPromised from 'chai-as-promised'
import {
  UniqueId,
  Property,
  DateProperty,
  BooleanProperty,
  ModelReferenceProperty,
  AdvancedModelReferenceProperty,
  ArrayProperty,
  ConstantValueProperty,
  ObjectProperty,
  NumberProperty,
  TextProperty,
  IntegerProperty,
  EmailProperty,
  NaturalIdProperty,
} from '../../src/properties'
import { TYPE_PRIMITIVES, arrayType } from '../../src/validation'
import { BaseModel } from '../../src/models'
import { isModelInstance } from '../../src/lib'
import {
  Model,
  ModelFetcher,
  ModelInstance,
  PrimaryKeyType,
  ValueOptional,
  ValueRequired,
  ValueRequiredR,
  ValueOptionalR,
  FunctionalModel,
  ModelReference,
  TypedJsonObj,
} from '../../src/interfaces'

chai.use(asPromised)

type TestModelType = { name: string }

const TestModel1 = BaseModel<TestModelType>('TestModel1', {
  properties: {
    name: TextProperty(),
  },
})

describe('/src/properties.ts', () => {
  describe('#NaturalIdProperty()', () => {
    it('should NOT throw an exception if a propertyKey returns an undefined value', () => {
      const MyModels = BaseModel<{ id: string; name: string; year: number }>(
        'MyModels',
        {
          properties: {
            id: NaturalIdProperty(['year', 'name'], '-', {}, {}),
            name: TextProperty({ required: true }),
            year: IntegerProperty({ required: true }),
          },
        }
      )
      const data = { id: '', year: 2022 }
      // @ts-ignore
      const instance = MyModels.create(data)
      assert.isFulfilled(
        Promise.resolve().then(async () => {
          await instance.get.id()
        })
      )
    })
    it('should resolve "undefined" when no values are provided', async () => {
      const MyModels = BaseModel<{ id: string; name: string; year: number }>(
        'MyModels',
        {
          properties: {
            id: NaturalIdProperty(['year', 'name'], '/', {}, {}),
            name: TextProperty({ required: true }),
            year: IntegerProperty({ required: true }),
          },
        }
      )
      const data = { id: '' }
      // @ts-ignore
      const instance = MyModels.create(data)
      const actual = await instance.get.id()
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should resolve "undefined" when one value is not provided', async () => {
      const MyModels = BaseModel<{ id: string; name: string; year: number }>(
        'MyModels',
        {
          properties: {
            id: NaturalIdProperty(['year', 'name'], '/', {}, {}),
            name: TextProperty({ required: true }),
            year: IntegerProperty({ required: true }),
          },
        }
      )
      const data = { id: '', name: 'name' }
      // @ts-ignore
      const instance = MyModels.create(data)
      const actual = await instance.get.id()
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should find 2022-mike when propertyKeys=[year, name], joiner=- and the values are 2022 and mike', async () => {
      const MyModels = BaseModel<{ id: string; name: string; year: number }>(
        'MyModels',
        {
          properties: {
            id: NaturalIdProperty(['year', 'name'], '-', {}, {}),
            name: TextProperty({ required: true }),
            year: IntegerProperty({ required: true }),
          },
        }
      )
      const data = { id: '', name: 'mike', year: 2022 }
      const instance = MyModels.create(data)
      // @ts-ignore
      const actual = await instance.get.id()
      const expected = '2022-mike'
      assert.equal(actual, expected)
    })
    it('should find 2022/5/10 using multiple model references', async () => {
      const Model1 = BaseModel<{ id: string; name: string }>('Model1', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      const Model2 = BaseModel<{ id: string; name: string }>('Model2', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      // @ts-ignore
      const customFetcher: ModelFetcher = <
        T extends FunctionalModel,
        TModel extends Model<T>,
      >(
        model: TModel,
        primaryKey: PrimaryKeyType
      ) => {
        if (model.getName() === 'Model1') {
          return Model1.create({
            id: 5,
            name: 'fake-model-data',
          })
        }
        if (model.getName() === 'Model2') {
          return Model2.create({
            id: 10,
            name: 'fake-model-data-2',
          })
        }
        throw new Error(`Not gonna happen`)
      }
      const MyModels = BaseModel<{
        id: string
        year: number
        foreignKey1: ModelReference<{ id: number; name: string }>
        foreignKey2: ModelReference<{ id: number; name: string }>
      }>('MyModels', {
        properties: {
          id: NaturalIdProperty(['year', 'foreignKey1', 'foreignKey2'], '/'),
          foreignKey1: ModelReferenceProperty(Model1, {
            required: true,
            fetcher: customFetcher,
          }),
          foreignKey2: ModelReferenceProperty(Model2, {
            required: true,
            fetcher: customFetcher,
          }),
          year: IntegerProperty({ required: true }),
        },
      })
      const data = { id: '', year: 2022, foreignKey1: 5, foreignKey2: 10 }
      const instance = MyModels.create(data)
      // @ts-ignore
      const actual = await instance.get.id()
      const expected = '2022/5/10'
      assert.equal(actual, expected)
    })
    it('should NOT throw an exception when a fetcher is not used when a nested key is requested', async () => {
      const Model1 = BaseModel<{ id: string; name: string }>('Model1', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      const Model2 = BaseModel<{ id: string; name: string }>('Model2', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      const MyModels = BaseModel<{
        id: string
        year: number
        foreignKey1: ModelReference<{ id: number; name: string }>
        foreignKey2: ModelReference<{ id: number; name: string }>
      }>('MyModels', {
        properties: {
          id: NaturalIdProperty(
            ['year', 'foreignKey1', 'foreignKey2.name'],
            '/'
          ),
          foreignKey1: ModelReferenceProperty(Model1, {
            required: true,
          }),
          foreignKey2: ModelReferenceProperty(Model2, {
            required: true,
          }),
          year: IntegerProperty({ required: true }),
        },
      })
      const data = { id: '', year: 2022, foreignKey1: 5, foreignKey2: 10 }
      const instance = MyModels.create(data)
      await assert.isFulfilled(
        Promise.resolve().then(async () => {
          await instance.get.id()
        })
      )
    })
    it('validates successfully if needing to compute id', async () => {
      const Model1 = BaseModel<{ id: string; name: string }>('Model1', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      const Model2 = BaseModel<{ id: string; name: string }>('Model2', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      // @ts-ignore
      const customFetcher: ModelFetcher = <
        T extends FunctionalModel,
        TModel extends Model<T>,
      >(
        model: TModel,
        primaryKey: PrimaryKeyType
      ) => {
        if (model.getName() === 'Model1') {
          return Model1.create({
            id: 5,
            name: 'fake-model-data',
          })
        }
        if (model.getName() === 'Model2') {
          return Model2.create({
            id: 10,
            name: 'fake-model-data-2',
          })
        }
        throw new Error(`Not gonna happen`)
      }
      const MyModels = BaseModel<{
        id: string
        year: number
        foreignKey1: ModelReference<{ id: number; name: string }>
        foreignKey2: ModelReference<{ id: number; name: string }>
      }>('MyModels', {
        properties: {
          id: NaturalIdProperty(
            ['year', 'foreignKey1', 'foreignKey2'],
            '/',
            { required: true },
            {}
          ),
          foreignKey1: ModelReferenceProperty(Model1, {
            required: true,
            fetcher: customFetcher,
          }),
          foreignKey2: ModelReferenceProperty(Model2, {
            required: true,
            fetcher: customFetcher,
          }),
          year: IntegerProperty({ required: true }),
        },
      })
      const data = { id: '', year: 2022, foreignKey1: 5, foreignKey2: 10 }
      const instance = MyModels.create(data)
      const actual = await instance.validate()
      const expected = {}
      assert.deepEqual(actual, expected)
    })
    it('should find 2022/5/fake-model-data-2 using multiple model references AND a nested model reference path', async () => {
      const Model1 = BaseModel<{ id: string; name: string }>('Model1', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      const Model2 = BaseModel<{ id: string; name: string }>('Model2', {
        properties: {
          id: NumberProperty(),
          name: TextProperty(),
        },
      })
      // @ts-ignore
      const customFetcher: ModelFetcher = <
        T extends FunctionalModel,
        TModel extends Model<T>,
      >(
        model: TModel,
        primaryKey: PrimaryKeyType
      ) => {
        if (model.getName() === 'Model1') {
          return Model1.create({
            id: 5,
            name: 'fake-model-data',
          })
        }
        if (model.getName() === 'Model2') {
          return Model2.create({
            id: 10,
            name: 'fake-model-data-2',
          })
        }
        throw new Error(`Not gonna happen`)
      }
      const MyModels = BaseModel<{
        id: string
        year: number
        foreignKey1: ModelReference<{ id: number; name: string }>
        foreignKey2: ModelReference<{ id: number; name: string }>
      }>('MyModels', {
        properties: {
          id: NaturalIdProperty(
            ['year', 'foreignKey1', 'foreignKey2.name'],
            '/',
            {},
            {}
          ),
          foreignKey1: ModelReferenceProperty(Model1, {
            required: true,
            fetcher: customFetcher,
          }),
          foreignKey2: ModelReferenceProperty(Model2, {
            required: true,
            fetcher: customFetcher,
          }),
          year: IntegerProperty({ required: true }),
        },
      })
      const data = { id: '', year: 2022, foreignKey1: 5, foreignKey2: 10 }
      const instance = MyModels.create(data)
      // @ts-ignore
      const actual = await instance.get.id()
      const expected = '2022/5/fake-model-data-2'
      assert.equal(actual, expected)
    })
    it('should find 2022/my-object-data using an object property with a nested key', async () => {
      const MyModels = BaseModel<{
        id: string
        year: number
        data: { name: string }
      }>('MyModels', {
        properties: {
          id: NaturalIdProperty(['year', 'data.name'], '/', {}, {}),
          data: ObjectProperty({ required: true }),
          year: IntegerProperty({ required: true }),
        },
      })
      const data = { id: '', year: 2022, data: { name: 'my-object-data' } }
      const instance = MyModels.create(data)
      const actual = await instance.get.id()
      const expected = '2022/my-object-data'
      assert.equal(actual, expected)
    })
    it('should find 2022/value using model references and a deeply nested value in ObjectProperty', async () => {
      type Model1Type = { id: string; data: { deeply: { nested: string } } }
      const Model1 = BaseModel<Model1Type>('Model1', {
        properties: {
          id: NumberProperty(),
          data: ObjectProperty(),
        },
      })
      // @ts-ignore
      const customFetcher: ModelFetcher = <
        T extends FunctionalModel,
        TModel extends Model<T>,
      >(
        model: TModel,
        primaryKey: PrimaryKeyType
      ) => {
        if (model.getName() === 'Model1') {
          return {
            id: 5,
            data: {
              deeply: {
                nested: 'value',
              },
            },
          }
        }
        throw new Error(`Not gonna happen`)
      }
      const MyModels = BaseModel<{
        id: string
        year: number
        foreignKey1: ModelReference<Model1Type>
      }>('MyModels', {
        properties: {
          id: NaturalIdProperty(
            ['year', 'foreignKey1.data.deeply.nested'],
            '/',
            {},
            {}
          ),
          foreignKey1: ModelReferenceProperty(Model1, {
            required: true,
            fetcher: customFetcher,
          }),
          year: IntegerProperty({ required: true }),
        },
      })
      const data = { id: '', year: 2022, foreignKey1: 5 }
      const instance = MyModels.create(data)
      // @ts-ignore
      const actual = await instance.get.id()
      const expected = '2022/value'
      assert.equal(actual, expected)
    })
  })
  describe('#EmailProperty()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          EmailProperty()
        })
      })
      it('should always have the value passed in', async () => {
        const PropertyInstance = EmailProperty({})
        const getter = PropertyInstance.createGetter(
          'testme@email.com',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = 'testme@email.com'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = EmailProperty({})
        const getter = PropertyInstance.createGetter(
          'testme@email.com',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })
  describe('#BooleanProperty()', () => {
    it('should be able to create without a config', () => {
      assert.doesNotThrow(() => {
        BooleanProperty()
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = BooleanProperty({})
        const getter = PropertyInstance.createGetter(
          true,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })
  describe('#ConstantValueProperty()', () => {
    describe('#createGetter()', () => {
      it('should always have the value passed in', async () => {
        const PropertyInstance =
          ConstantValueProperty<ValueRequired<string>>('constant')
        const getter = PropertyInstance.createGetter(
          'changed',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = 'constant'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance =
          ConstantValueProperty<ValueRequired<string>>('constant')
        const getter = PropertyInstance.createGetter(
          'changed',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })
  describe('#ObjectProperty()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          ObjectProperty()
        })
      })
      it('should be able to get the object passed in', async () => {
        const PropertyInstance = ObjectProperty({})
        const getter = PropertyInstance.createGetter(
          {
            my: 'object',
            complex: { it: 'is' },
          },
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = { my: 'object', complex: { it: 'is' } }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = ObjectProperty({})
        const getter = PropertyInstance.createGetter(
          {
            my: 'object',
            complex: { it: 'is' },
          },
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#NumberProperty()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          NumberProperty()
        })
      })
      it('should be able to create even with a null config', () => {
        assert.doesNotThrow(() => {
          // @ts-ignore
          NumberProperty(null)
        })
      })
      it('should be able to get the number passed in', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(
          5,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = 5
        assert.equal(actual, expected)
      })
      it('should be able to get float passed in', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(
          5.123,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = 5.123
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(
          5,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return and validate successful with a basic float', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(
          5.123,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a non integer input', async () => {
        const PropertyInstance = NumberProperty({})
        // @ts-ignore
        const getter = PropertyInstance.createGetter('string')
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5 and maxValue=3', async () => {
        const PropertyInstance = NumberProperty({ maxValue: 3 })
        const getter = PropertyInstance.createGetter(
          5,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const PropertyInstance = NumberProperty({ minValue: 3 })
        const getter = PropertyInstance.createGetter(
          2,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const PropertyInstance = NumberProperty({ minValue: 3, maxValue: 3 })
        const getter = PropertyInstance.createGetter(
          3,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#IntegerProperty()', () => {
    it('should be able to create even with a null config', () => {
      assert.doesNotThrow(() => {
        // @ts-ignore
        IntegerProperty(null)
      })
    })
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          IntegerProperty()
        })
      })
      it('should be able to get the number passed in', async () => {
        const PropertyInstance = IntegerProperty({})
        const getter = PropertyInstance.createGetter(
          5,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = 5
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = IntegerProperty({})
        const getter = PropertyInstance.createGetter(
          5,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return errors with a basic float', async () => {
        const PropertyInstance = IntegerProperty({})
        const getter = PropertyInstance.createGetter(
          5.123,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a non integer input', async () => {
        const PropertyInstance = IntegerProperty({})
        // @ts-ignore
        const getter = PropertyInstance.createGetter('string')
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5 and maxValue=3', async () => {
        const PropertyInstance = IntegerProperty({ maxValue: 3 })
        const getter = PropertyInstance.createGetter(
          5,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const PropertyInstance = IntegerProperty({ minValue: 3 })
        const getter = PropertyInstance.createGetter(
          2,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const PropertyInstance = IntegerProperty({ minValue: 3, maxValue: 3 })
        const getter = PropertyInstance.createGetter(
          3,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#TextProperty()', () => {
    it('should be able to create even with a null config', () => {
      assert.doesNotThrow(() => {
        // @ts-ignore
        TextProperty(null)
      })
    })
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          TextProperty()
        })
      })
      it('should be able to get the value passed in', async () => {
        const PropertyInstance = TextProperty({})
        const getter = PropertyInstance.createGetter(
          'basic input',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = 'basic input'
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = TextProperty({})
        const getter = PropertyInstance.createGetter(
          'basic input',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5', async () => {
        const PropertyInstance = TextProperty({})
        // @ts-ignore
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value="hello" and maxLength=3', async () => {
        const PropertyInstance = TextProperty({ maxLength: 3 })
        const getter = PropertyInstance.createGetter(
          'hello',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value="hello" and minLength=10', async () => {
        const PropertyInstance = TextProperty({ minLength: 10 })
        const getter = PropertyInstance.createGetter(
          'hello',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value="hello" and minLength=5 and maxLength=5', async () => {
        const PropertyInstance = TextProperty({ minLength: 5, maxLength: 5 })
        const getter = PropertyInstance.createGetter(
          'hello',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#ArrayProperty()', () => {
    describe('#createGetter()', () => {
      it('should return an array passed in without issue', async () => {
        const theProperty = ArrayProperty({})
        const getter = theProperty.createGetter(
          [1, 2, 3],
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
      it('should return an array passed in without issue, even if no config is passed', async () => {
        const theProperty = ArrayProperty()
        const getter = theProperty.createGetter(
          [1, 2, 3],
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
      it('should return an empty array if defaultValue is not changed in config and null is passed', async () => {
        const theProperty = ArrayProperty()
        // @ts-ignore
        const getter = theProperty.createGetter(null)
        const actual = await getter()
        const expected: any[] = []
        assert.deepEqual(actual, expected)
      })
      it('should return the passed in defaultValue if set in config and null is passed', async () => {
        const theProperty = ArrayProperty({ defaultValue: [1, 2, 3] })
        // @ts-ignore
        const getter = theProperty.createGetter(null)
        const actual = await getter()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should validate an array passed in without issue', async () => {
        const theProperty = ArrayProperty({})
        const getter = theProperty.createGetter(
          [1, 2, 3],
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = theProperty.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected: any[] = []
        assert.deepEqual(actual, expected)
      })
      it('should error an array passed in when it doesnt have the right types', async () => {
        const theProperty = ArrayProperty({
          validators: [arrayType(TYPE_PRIMITIVES.integer)],
        })
        const getter = theProperty.createGetter(
          [1, 'string', 3],
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = theProperty.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.deepEqual(actual.length, expected)
      })
      it('should validate an array with [4,4,5,5,6,6] when choices are [4,5,6]', async () => {
        const theProperty = ArrayProperty({ choices: [4, 5, 6] })
        const getter = theProperty.createGetter(
          [4, 4, 5, 5, 6, 6],
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = theProperty.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected: any[] = []
        assert.deepEqual(actual, expected)
      })
      it('should return errors when an array with [4,4,3,5,5,6,6] when choices are [4,5,6]', async () => {
        const theProperty = ArrayProperty({ choices: [4, 5, 6] })
        const getter = theProperty.createGetter(
          [4, 4, 3, 5, 5, 6, 6],
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const validator = theProperty.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
    })
  })
  describe('#Property()', () => {
    it('should throw an exception if a type is not provided', () => {
      assert.throws(() => {
        // @ts-ignore
        Property(undefined, {})
      })
    })
    it('should throw an exception if a type is not provided, and config is null', () => {
      assert.throws(() => {
        // @ts-ignore
        Property(undefined, null)
      })
    })
    it('should throw an exception if config.valueSelector is not a function but is set', () => {
      assert.throws(() => {
        // @ts-ignore
        Property('MyProperty', { valueSelector: 'blah' })
      })
    })
    it('should not throw an exception if config.valueSelector is a function', () => {
      assert.doesNotThrow(() => {
        Property('MyProperty', { valueSelector: () => ({}) })
      })
    })
    it('should not throw an exception if config is null', () => {
      assert.doesNotThrow(() => {
        // @ts-ignore
        Property('MyProperty', null)
      })
    })
    describe('#getConstantValue()', () => {
      it('should provide undefined if no config', () => {
        // @ts-ignore
        const instance = Property('MyTYpe', null)
        const actual = instance.getConstantValue()
        const expected = undefined
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getPropertyType()', () => {
      it('should use the type that is passed in via config', () => {
        const instance = Property('OverrideMe', { type: 'ExtendedType' })
        const actual = instance.getPropertyType()
        const expected = 'ExtendedType'
        assert.equal(actual, expected)
      })
    })
    describe('#getConfig()', () => {
      it('should provide the config that is passed in ', () => {
        // @ts-ignore
        const instance = Property('MyTYpe', { custom: 'value' })
        const actual = instance.getConfig()
        const expected = { custom: 'value' }
        assert.deepEqual(actual, expected)
      })
      it('should provide {} if no config', () => {
        // @ts-ignore
        const instance = Property('MyTYpe', null)
        const actual = instance.getConfig()
        const expected = {}
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getDefaultValue()', () => {
      it('should provide undefined if no config', () => {
        // @ts-ignore
        const instance = Property('MyTYpe', null)
        const actual = instance.getDefaultValue()
        const expected = undefined
        assert.deepEqual(actual, expected)
      })
      it('should provide the defaultValue that is passed in if no value', () => {
        // @ts-ignore
        const instance = Property('MyTYpe', { defaultValue: 'test-me' })
        const actual = instance.getDefaultValue()
        const expected = 'test-me'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getChoices()', () => {
      it('should provide [] if no config', () => {
        // @ts-ignore
        const instance = Property('MyTYpe', null)
        const actual = instance.getChoices()
        const expected: any[] = []
        assert.deepEqual(actual, expected)
      })
      it('should provide the choices that are passed in ', () => {
        // @ts-ignore
        const instance = Property('MyTYpe', { choices: [1, 2, 3] })
        const actual = instance.getChoices()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
    })
    describe('#createGetter()', () => {
      it('should return a function even if config.value is set to a value', () => {
        const instance = Property<string>('MyProperty', { value: 'my-value' })
        const actual = instance.createGetter(
          'not-my-value',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        assert.isFunction(actual)
      })
      it('should return the value passed into config.value regardless of what is passed into the createGetter', async () => {
        const instance = Property<string>('MyProperty', { value: 'my-value' })
        const actual = await instance.createGetter(
          'not-my-value',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value passed into createGetter when config.value is not set', async () => {
        const instance = Property('MyProperty')
        const actual = await instance.createGetter(
          'my-value',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value of the function passed into createGetter when config.value is not set', async () => {
        const instance = Property('MyProperty')
        const actual = await instance.createGetter(
          () => 'my-value',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
    })
  })
  describe('#UniqueId()', () => {
    describe('#createGetter()', () => {
      it('should call createUuid only once even if called twice', async () => {
        const uniqueProperty = UniqueId({})
        // @ts-ignore
        const getter = uniqueProperty.createGetter(undefined)
        const first = await getter()
        const second = await getter()
        assert.deepEqual(first, second)
      })
      it('should use the uuid passed in', async () => {
        const uniqueProperty = UniqueId({})
        const getter = uniqueProperty.createGetter(
          'my-uuid',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )
        const actual = await getter()
        const expected = 'my-uuid'
        assert.deepEqual(actual, expected)
      })
    })
  })
  describe('#DateProperty()', () => {
    it('should enforce ValueRequired for Date', async () => {
      const proto = DateProperty<ValueRequired<Date | string>>()
      const instance = proto.createGetter(
        new Date(),
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      assert.isOk(await instance())
    })
    it('should allow null if ValueOptional for Date', async () => {
      const proto = DateProperty<ValueOptional<Date | string>>()
      const instance = proto.createGetter(
        undefined,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      assert.isUndefined(await instance())
    })
    it('should allow creation without a config', async () => {
      const proto = DateProperty()
      const instance = proto.createGetter(
        new Date(),
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      assert.isOk(await instance())
    })
    it('should create a new date once when config.autoNow=true and called multiple times', async () => {
      const proto = DateProperty({ autoNow: true })
      const instance = proto.createGetter(
        undefined,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const first = await instance()
      const second = await instance()
      const third = await instance()
      assert.deepEqual(first, second)
      assert.deepEqual(first, third)
    })
    it('should use the date passed in', async () => {
      const proto = DateProperty({ autoNow: true })
      const date = new Date()
      const instance = proto.createGetter(
        date,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = await instance()
      const expected = date.toISOString()
      assert.deepEqual(actual, expected)
    })
    it('should return null, if null config is passed and no value created.', async () => {
      // @ts-ignore
      const proto = DateProperty(null)
      const date = null
      const instance = proto.createGetter(
        date,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = await instance()
      const expected = null
      assert.deepEqual(actual, expected)
    })
    it('should return a string when a string date is passed in', async () => {
      const proto = DateProperty({})
      const date = '2020-01-01T00:00:01.000Z'
      const instance = proto.createGetter(
        date,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = await instance()
      const expected = new Date(date).toISOString()
      assert.equal(actual, expected)
    })
    it('should return a string when a date object is passed in', async () => {
      const proto = DateProperty({})
      const date = new Date('2020-01-01T00:00:01.000Z')
      const instance = proto.createGetter(
        date,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = typeof (await instance())
      const expected = 'string'
      assert.equal(actual, expected)
    })
    it('should return a string when a date object is passed in', async () => {
      const proto = DateProperty({})
      const date = new Date('2020-01-01T00:00:01.000Z')
      const instance = proto.createGetter(
        date,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = typeof (await instance())
      const expected = 'string'
      assert.equal(actual, expected)
    })
    it('should return the expected string when a date object is passed in and format is provided', async () => {
      const proto = DateProperty({
        format: 'MMMM',
      })
      const date = new UTCDate('2020-01-01T00:00:01.000Z')
      const instance = proto.createGetter(
        date,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = await instance()
      const expected = 'January'
      assert.equal(actual, expected)
    })
    it('should return the expected date only string when a date object is passed in and isDateOnly:true', async () => {
      const proto = DateProperty({
        isDateOnly: true,
      })
      const date = new UTCDate('2020-01-01T00:00:01.000Z')
      const instance = proto.createGetter(
        date,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = await instance()
      const expected = '2020-01-01'
      assert.equal(actual, expected)
    })
    it('should a date string when autoNow, isDateOnly=true and no value is provided', async () => {
      const proto = DateProperty({
        isDateOnly: true,
        autoNow: true,
      })
      const instance = proto.createGetter(
        null,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = (await instance()) as string
      const re = /[0-9]{4}-[0-9]{2}-[0-9]{2}/g
      const found = actual.match(re)
      assert.isOk(found)
    })
    it('should formatted string when autoNow, format=yyyy and no value is provided', async () => {
      const proto = DateProperty({
        format: 'yyyy',
        autoNow: true,
      })
      const instance = proto.createGetter(
        null,
        {},
        {} as unknown as ModelInstance<FunctionalModel>
      )
      const actual = (await instance()) as string
      const re = /[0-9]{4}/g
      const found = actual.match(re)
      assert.isOk(found)
    })
  })
  describe('#AdvancedModelReferenceProperty()', () => {
    it('should not throw an exception when a custom Model is passed in', () => {
      type MyType = { name: string }
      type MyModel<T extends FunctionalModel> = Model<T> & {
        extended: () => {}
      }
      type MyModelInstance<
        T extends FunctionalModel,
        TModel extends Model<T>,
      > = ModelInstance<T, TModel> & {
        extended2: () => {}
      }
      type CustomReferenceType<T extends FunctionalModel> = ModelReference<T>
      const model = BaseModel<
        MyType,
        MyModel<MyType>,
        MyModelInstance<MyType, MyModel<MyType>>
      >('Test', {
        properties: { name: TextProperty() },
      })
      assert.doesNotThrow(async () => {
        AdvancedModelReferenceProperty<
          MyType,
          MyModel<MyType>,
          MyModelInstance<MyType, MyModel<MyType>>,
          CustomReferenceType<MyType>
        >(model)
      })
    })
  })
  describe('#ModelReferenceProperty()', () => {
    it('should throw an exception if a model value is not passed in', () => {
      assert.throws(() => {
        const input = ['obj-id']
        // @ts-ignore
        const actual = ModelReferenceProperty(null, {})
      })
    })
    describe('#getReferencedModel()', () => {
      it('should return the same value passed in as the model', async () => {
        const property = ModelReferenceProperty(TestModel1)
        const actual = property.getReferencedModel()
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
      it('should allow a function input for model to allow delayed creation', async () => {
        const property = ModelReferenceProperty(() => TestModel1)
        const actual = property.getReferencedModel()
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
    })
    describe('#createGetter()', () => {
      it('should return "obj-id" when no fetcher is used', async () => {
        const actual = await ModelReferenceProperty<TestModelType>(
          TestModel1,
          {}
        ).createGetter(
          'obj-id',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const expected = 'obj-id'
        assert.equal(actual, expected)
      })
      it('should allow null as the input', async () => {
        const actual = await ModelReferenceProperty<
          TestModelType,
          ValueOptionalR<TestModelType>
        >(TestModel1, {}).createGetter(
          null,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const expected = null
        assert.equal(actual, expected)
      })
      it('should return an object instance TypedJson when no fetcher is used', async () => {
        const actual = await ModelReferenceProperty<TestModelType>(
          TestModel1,
          {}
        ).createGetter(
          // @ts-ignore
          { id: 'obj-id' },
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        assert.isTrue(isModelInstance(actual))
      })
      it('should return 123 from {}.id when no fetcher is used', async () => {
        const actual = await ModelReferenceProperty<TestModelType>(
          TestModel1,
          {}
        ).createGetter(
          123,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const expected = 123
        assert.equal(actual, expected)
      })
      it('should return a shallow object with a replaced toObj() function that returns 123 from when a ModelInstance is used and no fetcher is used', async () => {
        const fakeModel = {
          getPrimaryKeyName: () => 'not-real',
          getPrimaryKey: () => 123,
        }
        const modelInstance = await ModelReferenceProperty<TestModelType>(
          TestModel1,
          {}
        ).createGetter(
          // @ts-ignore
          fakeModel,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        // @ts-ignore
        const actual = await modelInstance?.toObj()
        const expected = 123
        assert.equal(actual, expected)
      })
      it('should return a ModelInstance from TypedJson<T> set as the value', async () => {
        type MyType = {
          id: number
          name: string
        }
        const typedJson: TypedJsonObj<MyType> = {
          id: 5,
          name: 'My data',
        }
        const MyTypesModel = BaseModel<MyType>('MyTypes', {
          properties: {
            id: NumberProperty(),
            name: TextProperty(),
          },
        })
        const modelInstance = await ModelReferenceProperty<MyType>(
          MyTypesModel,
          {}
        ).createGetter(
          typedJson,
          // @ts-ignore
          typedJson,
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        // @ts-ignore
        const actual = await modelInstance?.toObj()
        const expected = 5
        assert.equal(actual, expected)
      })
      it('should return name:"switch-a-roo" when switch-a-roo fetcher is used', async () => {
        const model = BaseModel<TestModelType>('Test', {
          properties: {
            name: TextProperty(),
          },
        })

        const modelFetcher: ModelFetcher = (theirModel: any, key) => {
          const m = model.create({ id: 123, name: 'switch-a-roo' })
          return Promise.resolve(m as any)
        }

        const actual = (await ModelReferenceProperty<TestModelType>(
          TestModel1,
          {
            fetcher: modelFetcher,
          }
        ).createGetter(
          123,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()) as ModelInstance<TestModelType>

        const expected = 'switch-a-roo'
        assert.deepEqual(actual.get.name(), expected)
      })
      it('should return "obj-id" if no config passed', async () => {
        // @ts-ignore
        const actual = (await ModelReferenceProperty(
          // @ts-ignore
          TestModel1,
          // @ts-ignore
          null
        ).createGetter(
          'obj-id',
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()) as string
        const expected = 'obj-id'
        assert.deepEqual(actual, expected)
      })
      it('should return null when fetcher is used, but the instance value passed in is empty', async () => {
        const model = BaseModel<TestModelType>('Test', {
          properties: {
            name: TextProperty(),
          },
        })
        const modelFetcher: ModelFetcher = <
          T extends FunctionalModel,
          TModel extends Model<T>,
        >() => {
          return Promise.resolve({
            id: 123,
            name: 'switch-a-roo',
          } as unknown as TypedJsonObj<T>)
        }
        const actual = await ModelReferenceProperty<
          TestModelType,
          ValueOptionalR<TestModelType>
        >(TestModel1, {
          fetcher: modelFetcher,
        }).createGetter(
          null,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const expected = null
        assert.deepEqual(actual, expected)
      })
      it('should provide the passed in model and the instance values when switch-a-roo fetcher is used', async () => {
        const input = 'obj-id'
        const fetcher = sinon.stub().callsFake((modelName, id) => ({ id }))
        await ModelReferenceProperty(TestModel1, {
          fetcher,
        }).createGetter(
          input,
          {},
          {} as unknown as ModelInstance<FunctionalModel>
        )()
        const actual = fetcher.getCall(0).args[0]
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
    })
  })
})
