import sinon from 'sinon'
import { assert } from 'chai'
import {
  TextProperty,
  PrimaryKeyUuidProperty,
  OrmModelFactory,
  PropertyQuery,
  OrmModel,
  createOrm as orm,
  uniqueTogether,
  unique,
  buildOrmValidatorContext,
} from '../../../src'
import { createDatastore } from './mocks'

type TestType1 = { id: string; name?: string; description?: string }

const setupMocks = () => {
  const datastoreProvider = createDatastore()
  const instance = orm({ datastoreAdapter: datastoreProvider })
  return {
    ormInstance: instance,
    Model: instance.Model,
    datastoreProvider,
  }
}

const createTestModel1 = (Model: OrmModelFactory) =>
  Model<TestType1>({
    pluralName: 'TestModel1',
    namespace: 'functional-models',
    properties: {
      id: PrimaryKeyUuidProperty({ defaultValue: 'test-id' }),
      name: TextProperty(),
      description: TextProperty(),
    },
  })

describe('/src/orm/validation.js', () => {
  describe('#unique()', () => {
    it('should call search model.search', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      const instance = model.create<'id'>({
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      await unique<TestType1>('name')('my-name', instance, instanceData, {})
      // @ts-ignore
      sinon.assert.calledOnce(model.search)
    })
    it('should return an error when 1 instance is returned with a different id but same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'my-name',
        instance,
        instanceData,
        {}
      )
      assert.isOk(actual)
    })
    it('should return undefined when 1 instance is returned with the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'name',
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return undefined when 2 instances are returned with one having the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'name',
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return an error when 2 instances are returned with none having the same id but having the same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id-something-else',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await unique<TestType1>('name')(
        'name',
        instance,
        instanceData,
        {}
      )
      assert.isOk(actual)
    })
  })
  describe('#uniqueTogether()', () => {
    it('should create an query with take(2)', async () => {
      const { Model, datastoreProvider } = setupMocks()
      const model = createTestModel1(Model)
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )

      const actual = datastoreProvider.search.getCall(0).args[1].take
      const expected = 2
      assert.deepEqual(actual, expected)
    })
    it('should create a query with each propertyKey passed in', async () => {
      const { Model, datastoreProvider } = setupMocks()
      const model = createTestModel1(Model)
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )

      const query = datastoreProvider.search.getCall(0).args[1].query
      const actual = [
        [query[0].key, query[0].value],
        [query[2].key, query[2].value],
      ]

      const expected = [
        ['name', 'my-name'],
        ['description', 'my-description'],
      ]
      assert.deepEqual(actual, expected)
    })
    it('should call search model.search', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      const search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      // @ts-ignore
      model.search = search
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )
      sinon.assert.calledOnce(search)
    })
    it('should call search model.search when no options is passed in', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      const search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      // @ts-ignore
      model.search = search
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )
      sinon.assert.calledOnce(search)
    })
    it('should not call search model.search when noOrmValidation is true', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      const search = sinon.stub().resolves({
        instances: [],
        page: null,
      })
      // @ts-ignore
      model.search = search
      const instance = model.create<'id'>({
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        { noOrmValidation: true }
      )
      sinon.assert.notCalled(search)
    })
    it('should return an error when 1 instance is returned with a different id but same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            name: 'my-name',
            description: 'my-description',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        name: 'my-name',
        description: 'my-description',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name'])(
        instance,
        instanceData,
        {}
      )
      assert.isOk(actual)
    })
    it('should return undefined when 1 instance is returned with the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id',
            description: 'my-description',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name'])(
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return undefined when 2 instances are returned with one having the same id and same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            description: 'my-description',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id',
            description: 'my-description',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name'])(
        instance,
        instanceData,
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return an error when 2 instances are returned with none having the same id but having the same value', async () => {
      const { Model } = setupMocks()
      const model = createTestModel1(Model)
      // @ts-ignore
      model.search = sinon.stub().resolves({
        instances: [
          model.create({
            id: 'test-id-older',
            description: 'my-description',
            name: 'my-name',
          }),
          model.create({
            id: 'test-id-something-else',
            description: 'my-description',
            name: 'my-name',
          }),
        ],
        page: null,
      })
      const instance = model.create({
        id: 'test-id',
        description: 'my-description',
        name: 'my-name',
      })
      const instanceData = await instance.toObj<TestType1>()
      const actual = await uniqueTogether<TestType1>(['name', 'description'])(
        instance,
        instanceData,
        {}
      )
      const expected = `name,description must be unique together. Another instance found.`
      assert.deepEqual(actual, expected)
    })
  })
  describe('#buildOrmValidationOptions()', () => {
    it('should return noOrmValidation=false when nothing is passed in', () => {
      const instance = buildOrmValidatorContext({})
      const actual = instance.noOrmValidation
      const expected = false
      assert.equal(actual, expected)
    })
    it('should return noOrmValidation=true when passed in', () => {
      const instance = buildOrmValidatorContext({ noOrmValidation: true })
      const actual = instance.noOrmValidation
      const expected = true
      assert.equal(actual, expected)
    })
  })
})
