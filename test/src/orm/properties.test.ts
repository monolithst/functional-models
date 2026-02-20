import { assert } from 'chai'
import {
  OrmModel,
  PropertyValidatorComponent,
  unique,
  ormPropertyConfig,
  ForeignKeyProperty,
  LastModifiedDateProperty,
  PrimaryKeyProperty,
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
      const prop = ForeignKeyProperty(DummyModel, {
        dataType: PropertyType.UniqueId,
      })
      assert.equal(prop.getPropertyType(), PropertyType.UniqueId)
      // @ts-ignore
      assert.equal(prop.getConfig().dataType, PropertyType.UniqueId)
    })

    it('should use IntegerProperty when dataType is integer', () => {
      const prop = ForeignKeyProperty(DummyModel, {
        dataType: PropertyType.Integer,
      })
      assert.equal(prop.getPropertyType(), PropertyType.Integer)
      // @ts-ignore
      assert.equal(prop.getConfig().dataType, PropertyType.Integer)
    })

    it('should use TextProperty when dataType is string', () => {
      const prop = ForeignKeyProperty(DummyModel, {
        dataType: PropertyType.Text,
      })
      assert.equal(prop.getPropertyType(), PropertyType.Text)
      // @ts-ignore
      assert.equal(prop.getConfig().dataType, PropertyType.Text)
    })

    it('should resolve model if passed as a function', () => {
      const prop = ForeignKeyProperty(DummyModelFn, {
        dataType: PropertyType.UniqueId,
      })
      assert.deepEqual(prop.getReferencedModel(), DummyModel)
    })

    it('getReferencedId should return the instance value', () => {
      const prop = ForeignKeyProperty(DummyModel, {
        dataType: PropertyType.UniqueId,
      })
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

  describe('#PrimaryKeyProperty()', () => {
    it('should return UuidProperty when dataType is UniqueId', () => {
      const prop = PrimaryKeyProperty({ dataType: PropertyType.UniqueId })
      assert.equal(prop.getPropertyType(), PropertyType.UniqueId)
    })

    it('should return IntegerProperty when dataType is Integer', () => {
      const prop = PrimaryKeyProperty({ dataType: PropertyType.Integer })
      assert.equal(prop.getPropertyType(), PropertyType.Integer)
    })

    it('should return TextProperty when dataType is Text or unspecified', () => {
      const propText = PrimaryKeyProperty({ dataType: PropertyType.Text })
      assert.equal(propText.getPropertyType(), PropertyType.Text)
      const propDefault = PrimaryKeyProperty()
      assert.equal(propDefault.getPropertyType(), PropertyType.Text)
    })

    it('should use custom primaryKeyGenerator when provided (Integer type)', async () => {
      const customGenerator = async () => 42
      const prop = PrimaryKeyProperty({
        dataType: PropertyType.Integer,
        primaryKeyGenerator: customGenerator,
      })
      const getter = prop.createGetter(undefined, {}, {} as any)
      const value = await getter()
      assert.equal(value, 42)
    })

    it('should respect auto: false and return value when no generator', async () => {
      const prop = PrimaryKeyProperty({
        dataType: PropertyType.Text,
        auto: false,
      })
      const getter = prop.createGetter('existing-id', {}, {} as any)
      const value = await getter()
      assert.equal(value, 'existing-id')
    })

    it('should generate uuid when auto and dataType UniqueId', async () => {
      const prop = PrimaryKeyProperty({
        dataType: PropertyType.UniqueId,
        auto: true,
      })
      const getter = prop.createGetter(undefined, {}, {} as any)
      const value = await getter()
      assert.isString(value)
      assert.match(value, /^[0-9a-f-]{36}$/i)
    })

    it('should generate integer when auto and dataType Integer', async () => {
      const prop = PrimaryKeyProperty({
        dataType: PropertyType.Integer,
        auto: true,
      })
      const getter = prop.createGetter(undefined, {}, {} as any)
      const value = await getter()
      assert.isNumber(value)
    })
  })
})
