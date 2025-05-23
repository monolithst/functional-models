import { assert } from 'chai'
import {
  OrmModel,
  PropertyValidatorComponent,
  unique,
  ormPropertyConfig,
  ForeignKeyProperty,
  LastModifiedDateProperty,
} from '../../../src'
import { PropertyType } from '../../../src/types'

describe('/src/orm/properties.ts', () => {
  describe('#ormPropertyConfig()', () => {
    it('should return one validator when unique:key is set', () => {
      const input = { unique: 'key' }
      const actual = ormPropertyConfig(input)?.validators?.length
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should return two validators when unique:key and another validator is added', () => {
      const validators: readonly PropertyValidatorComponent<any, any, any>[] = [
        unique('somethingelse'),
      ]
      const input = { unique: 'key', validators }
      const actual = ormPropertyConfig<string>(input)?.validators?.length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return a property passed in that is unhandled by the function', () => {
      const input = { unique: 'key', somethingNotThere: 'here' }
      // @ts-ignore
      const actual = ormPropertyConfig(input)?.somethingNotThere
      const expected = 'here'
      assert.equal(actual, expected)
    })
    it('should return no validators when an empty obj is passed', () => {
      const input = {}
      const actual = ormPropertyConfig(input)?.validators?.length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should return no validators when nothing is passed', () => {
      const actual = ormPropertyConfig()?.validators?.length
      const expected = 0
      assert.equal(actual, expected)
    })
  })

  describe('#ForeignKeyProperty()', () => {
    // Minimal valid ModelType mock
    const DummyModel: OrmModel<any> = {
      getName: () => 'Dummy',
      getModelDefinition: () => ({
        pluralName: 'Dummies',
        namespace: 'test',
        properties: {},
        primaryKeyName: 'id',
        modelValidators: [],
        singularName: 'Dummy',
        displayName: 'Dummy',
        description: 'A dummy model',
      }),
      getPrimaryKey: () => 'id',
      getApiInfo: () => ({
        noPublish: false,
        onlyPublish: [],
        // @ts-ignore
        rest: {},
        createOnlyOne: false,
      }),
      create: () => ({}),
    }
    const DummyModelFn = () => DummyModel

    it('should use UuidProperty when dataType is uuid', () => {
      const prop = ForeignKeyProperty(DummyModel, { dataType: 'uuid' })
      assert.equal(prop.getPropertyType(), PropertyType.UniqueId)
      // @ts-ignore
      assert.equal(prop.getConfig().dataType, 'uuid')
    })

    it('should use IntegerProperty when dataType is integer', () => {
      const prop = ForeignKeyProperty(DummyModel, { dataType: 'integer' })
      assert.equal(prop.getPropertyType(), PropertyType.Integer)
      // @ts-ignore
      assert.equal(prop.getConfig().dataType, 'integer')
    })

    it('should use TextProperty when dataType is string', () => {
      const prop = ForeignKeyProperty(DummyModel, { dataType: 'string' })
      assert.equal(prop.getPropertyType(), PropertyType.Text)
      // @ts-ignore
      assert.equal(prop.getConfig().dataType, 'string')
    })

    it('should resolve model if passed as a function', () => {
      const prop = ForeignKeyProperty(DummyModelFn, { dataType: 'uuid' })
      assert.deepEqual(prop.getReferencedModel(), DummyModel)
    })

    it('getReferencedId should return the instance value', () => {
      const prop = ForeignKeyProperty(DummyModel, { dataType: 'uuid' })
      assert.equal(prop.getReferencedId('abc-123'), 'abc-123')
    })
  })

  describe('#LastModifiedDateProperty()', () => {
    it('should return a property with lastModifiedUpdateMethod', () => {
      const prop = LastModifiedDateProperty()
      assert.isFunction(prop.lastModifiedUpdateMethod)
      const date = prop.lastModifiedUpdateMethod()
      assert.instanceOf(date, Date)
    })
  })
})
