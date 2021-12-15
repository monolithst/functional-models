import { assert } from 'chai'
import sinon from 'sinon'
import {
  UniqueId,
  Property,
  DateProperty,
  BooleanProperty,
  ReferenceProperty,
  ArrayProperty,
  ConstantValueProperty,
  ObjectProperty,
  NumberProperty,
  TextProperty,
  IntegerProperty,
  EmailProperty,
} from '../../src/properties'
import { TYPE_PRIMITIVES, arrayType } from '../../src/validation'
import { BaseModel } from '../../src/models'
import { ModelInstance } from '../../src/interfaces'

type TestModelType = { name: string }
const TestModel1 = BaseModel<TestModelType>('TestModel1', {
  properties: {
    name: TextProperty(),
  },
})

describe('/src/properties.ts', () => {
  describe('#EmailProperty()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          EmailProperty()
        })
      })
      it('should always have the value passed in', async () => {
        const PropertyInstance = EmailProperty({})
        const getter = PropertyInstance.createGetter('testme@email.com')
        const actual = await getter()
        const expected = 'testme@email.com'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = EmailProperty({})
        const getter = PropertyInstance.createGetter('testme@email.com')
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
        const getter = PropertyInstance.createGetter(true)
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
        const PropertyInstance = ConstantValueProperty('constant')
        const getter = PropertyInstance.createGetter('changed')
        const actual = await getter()
        const expected = 'constant'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = ConstantValueProperty('constant')
        const getter = PropertyInstance.createGetter('changed')
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
        const getter = PropertyInstance.createGetter({
          my: 'object',
          complex: { it: 'is' },
        })
        const actual = await getter()
        const expected = { my: 'object', complex: { it: 'is' } }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = ObjectProperty({})
        const getter = PropertyInstance.createGetter({
          my: 'object',
          complex: { it: 'is' },
        })
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
        const getter = PropertyInstance.createGetter(5)
        const actual = await getter()
        const expected = 5
        assert.equal(actual, expected)
      })
      it('should be able to get float passed in', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(5.123)
        const actual = await getter()
        const expected = 5.123
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator(null, {})
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return and validate successful with a basic float', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(5.123)
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
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const PropertyInstance = NumberProperty({ minValue: 3 })
        const getter = PropertyInstance.createGetter(2)
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const PropertyInstance = NumberProperty({ minValue: 3, maxValue: 3 })
        const getter = PropertyInstance.createGetter(3)
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
        const getter = PropertyInstance.createGetter(5)
        const actual = await getter()
        const expected = 5
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = IntegerProperty({})
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return errors with a basic float', async () => {
        const PropertyInstance = IntegerProperty({})
        const getter = PropertyInstance.createGetter(5.123)
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
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const PropertyInstance = IntegerProperty({ minValue: 3 })
        const getter = PropertyInstance.createGetter(2)
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const PropertyInstance = IntegerProperty({ minValue: 3, maxValue: 3 })
        const getter = PropertyInstance.createGetter(3)
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
        const getter = PropertyInstance.createGetter('basic input')
        const actual = await getter()
        const expected = 'basic input'
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const PropertyInstance = TextProperty({})
        const getter = PropertyInstance.createGetter('basic input')
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
        const getter = PropertyInstance.createGetter('hello')
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value="hello" and minLength=10', async () => {
        const PropertyInstance = TextProperty({ minLength: 10 })
        const getter = PropertyInstance.createGetter('hello')
        const validator = PropertyInstance.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value="hello" and minLength=5 and maxLength=5', async () => {
        const PropertyInstance = TextProperty({ minLength: 5, maxLength: 5 })
        const getter = PropertyInstance.createGetter('hello')
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
        const getter = theProperty.createGetter([1, 2, 3])
        const actual = await getter()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
      it('should return an array passed in without issue, even if no config is passed', async () => {
        const theProperty = ArrayProperty()
        const getter = theProperty.createGetter([1, 2, 3])
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
        const getter = theProperty.createGetter([1, 2, 3])
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
        const getter = theProperty.createGetter([1, 'string', 3])
        const validator = theProperty.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected = 1
        assert.deepEqual(actual.length, expected)
      })
      it('should validate an array with [4,4,5,5,6,6] when choices are [4,5,6]', async () => {
        const theProperty = ArrayProperty({ choices: [4, 5, 6] })
        const getter = theProperty.createGetter([4, 4, 5, 5, 6, 6])
        const validator = theProperty.getValidator(getter)
        // @ts-ignore
        const actual = await validator()
        const expected: any[] = []
        assert.deepEqual(actual, expected)
      })
      it('should return errors when an array with [4,4,3,5,5,6,6] when choices are [4,5,6]', async () => {
        const theProperty = ArrayProperty({ choices: [4, 5, 6] })
        const getter = theProperty.createGetter([4, 4, 3, 5, 5, 6, 6])
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
        const instance = Property('MyProperty', { value: 'my-value' })
        const actual = instance.createGetter('not-my-value')
        assert.isFunction(actual)
      })
      it('should return the value passed into config.value regardless of what is passed into the createGetter', async () => {
        const instance = Property('MyProperty', { value: 'my-value' })
        const actual = await instance.createGetter('not-my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value passed into createGetter when config.value is not set', async () => {
        const instance = Property('MyProperty')
        const actual = await instance.createGetter('my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value of the function passed into createGetter when config.value is not set', async () => {
        const instance = Property('MyProperty')
        const actual = await instance.createGetter(() => 'my-value')()
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
        const getter = uniqueProperty.createGetter('my-uuid')
        const actual = await getter()
        const expected = 'my-uuid'
        assert.deepEqual(actual, expected)
      })
    })
  })
  describe('#DateProperty()', () => {
    it('should allow creation without a config', async () => {
      const proto = DateProperty()
      const instance = proto.createGetter(new Date())
      assert.isOk(await instance())
    })
    it('should create a new date once when config.autoNow=true and called multiple times', async () => {
      const proto = DateProperty({ autoNow: true })
      const instance = proto.createGetter(undefined)
      const first = await instance()
      const second = await instance()
      const third = await instance()
      assert.deepEqual(first, second)
      assert.deepEqual(first, third)
    })
    it('should use the date passed in', async () => {
      const proto = DateProperty({ autoNow: true })
      const date = new Date()
      const instance = proto.createGetter(date)
      const actual = await instance()
      const expected = date
      assert.deepEqual(actual, expected)
    })
    it('should return null, if null config is passed and no value created.', async () => {
      // @ts-ignore
      const proto = DateProperty(null)
      const date = null
      const instance = proto.createGetter(date)
      const actual = await instance()
      const expected = null
      assert.deepEqual(actual, expected)
    })
  })

  describe('#ReferenceProperty()', () => {
    it('should throw an exception if a model value is not passed in', () => {
      assert.throws(() => {
        const input = ['obj-id']
        // @ts-ignore
        const actual = ReferenceProperty(null, {})
      })
    })
    describe('#meta.getReferencedModel()', () => {
      it('should return the same value passed in as the model', async () => {
        const property = ReferenceProperty(TestModel1)
        const actual = property.getReferencedModel()
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
      it('should allow a function input for model to allow delayed creation', async () => {
        const property = ReferenceProperty(() => TestModel1)
        const actual = property.getReferencedModel()
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
    })
    describe('#createGetter()', () => {
      it('should return "obj-id" when no fetcher is used', async () => {
        const actual = await ReferenceProperty(TestModel1, {}).createGetter(
          'obj-id'
        )()
        const expected = 'obj-id'
        assert.equal(actual, expected)
      })
      it('should allow null as the input', async () => {
        const actual = await ReferenceProperty(TestModel1, {}).createGetter(
          null
        )()
        const expected = null
        assert.equal(actual, expected)
      })
      it('should return "obj-id" from {}.id when no fetcher is used', async () => {
        const actual = await ReferenceProperty(TestModel1, {}).createGetter(
          // @ts-ignore
          { id: 'obj-id' }
        )()
        const expected = 'obj-id'
        assert.equal(actual, expected)
      })

      it('should throw an exception when there is instanceValues as an object, but it does not have a value for the primaryKey.', async () => {
        await assert.isRejected(
          ReferenceProperty(TestModel1, {
            // @ts-ignore
          }).createGetter({ notPrimaryKey: 'ok' })() as Promise<any>
        )
      })
      it('should return name:"switch-a-roo" when switch-a-roo fetcher is used', async () => {
        const actual = (await ReferenceProperty(TestModel1, {
          fetcher: async () => ({ id: 'obj-id', name: 'switch-a-roo' }),
        }).createGetter('obj-id')()) as ModelInstance<TestModelType>
        const expected = 'switch-a-roo'
        assert.deepEqual(actual.get.name(), expected)
      })
      it('should return "obj-id" if no config passed', async () => {
        // @ts-ignore
        const actual = (await ReferenceProperty(TestModel1, null).createGetter(
          'obj-id'
        )()) as string
        const expected = 'obj-id'
        assert.deepEqual(actual, expected)
      })
      it('should return null when fetcher is used, but the instance value passed in is empty', async () => {
        const actual = (await ReferenceProperty(TestModel1, {
          fetcher: async () => ({ id: 'obj-id', name: 'switch-a-roo' }),
        }).createGetter(null)()) as ModelInstance<TestModelType>
        const expected = null
        assert.deepEqual(actual, expected)
      })
      it('should provide the passed in model and the instance values when switch-a-roo fetcher is used', async () => {
        const input = 'obj-id'
        const fetcher = sinon.stub().callsFake((modelName, id) => ({ id }))
        await ReferenceProperty(TestModel1, {
          fetcher,
        }).createGetter(input)()
        const actual = fetcher.getCall(0).args[0]
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
      it('should take the smartObject as a value', async () => {
        const id = 'obj-id'
        const proto = BaseModel<TestModelType>('name', {
          properties: {
            id: UniqueId({ value: id }),
            name: TextProperty({}),
          },
        })
        const input = proto.create({ id, name: 'name' })
        const instance = (await ReferenceProperty<TestModelType>(
          TestModel1,
          {}
        ).createGetter(input)()) as ModelInstance<TestModelType>
        const actual = await instance.get.id()
        const expected = 'obj-id'
        assert.deepEqual(actual, expected)
      })
      describe('#toObj()', () => {
        it('should use the getId of the smartObject passed in when toObj is called', async () => {
          const proto = BaseModel<TestModelType>('name', {
            properties: {
              id: UniqueId({ value: 'obj-id' }),
              name: TextProperty({}),
            },
          })
          const input = proto.create({ id: 'obj-id', name: 'name' })
          const instance = (await ReferenceProperty<TestModelType>(
            TestModel1,
            {}
          ).createGetter(input)()) as ModelInstance<{}>
          const actual = await instance.toObj()
          const expected = 'obj-id'
          assert.deepEqual(actual, expected)
        })
        it('should return "obj-id" when switch-a-roo fetcher is used and toObj is called', async () => {
          const input = 'obj-id'
          const instance = (await ReferenceProperty(TestModel1, {
            fetcher: () =>
              Promise.resolve({ id: 'obj-id', prop: 'switch-a-roo' }),
          }).createGetter(input)()) as ModelInstance<{}>
          const actual = await instance.toObj()
          const expected = 'obj-id'
          assert.deepEqual(actual, expected)
        })
      })
    })
  })
})
