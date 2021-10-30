const assert = require('chai').assert
const sinon = require('sinon')
const {
  UniqueId,
  Property,
  DateProperty,
  ReferenceProperty,
  ArrayProperty,
  ConstantValueProperty,
  ObjectProperty,
  NumberProperty,
  TextProperty,
  IntegerProperty,
  EmailProperty,
} = require('../../src/properties')
const { TYPE_PRIMATIVES, arrayType } = require('../../src/validation')
const { Model } = require('../../src/models')

const TestModel1 = Model('TestModel1', {
  id: UniqueId(),
  name: TextProperty(),
})

describe('/src/properties.js', () => {
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
        const actual = await validator()
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
        const actual = await validator()
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
        const actual = await validator()
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
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return and validate successful with a basic float', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter(5.123)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a non integer input', async () => {
        const PropertyInstance = NumberProperty({})
        const getter = PropertyInstance.createGetter('string')
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5 and maxValue=3', async () => {
        const PropertyInstance = NumberProperty({ maxValue: 3 })
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const PropertyInstance = NumberProperty({ minValue: 3 })
        const getter = PropertyInstance.createGetter(2)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const PropertyInstance = NumberProperty({ minValue: 3, maxValue: 3 })
        const getter = PropertyInstance.createGetter(3)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#IntegerProperty()', () => {
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
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return errors with a basic float', async () => {
        const PropertyInstance = IntegerProperty({})
        const getter = PropertyInstance.createGetter(5.123)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a non integer input', async () => {
        const PropertyInstance = IntegerProperty({})
        const getter = PropertyInstance.createGetter('string')
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5 and maxValue=3', async () => {
        const PropertyInstance = IntegerProperty({ maxValue: 3 })
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const PropertyInstance = IntegerProperty({ minValue: 3 })
        const getter = PropertyInstance.createGetter(2)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const PropertyInstance = IntegerProperty({ minValue: 3, maxValue: 3 })
        const getter = PropertyInstance.createGetter(3)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#TextProperty()', () => {
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
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5', async () => {
        const PropertyInstance = TextProperty({})
        const getter = PropertyInstance.createGetter(5)
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value="hello" and maxLength=3', async () => {
        const PropertyInstance = TextProperty({ maxLength: 3 })
        const getter = PropertyInstance.createGetter('hello')
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value="hello" and minLength=10', async () => {
        const PropertyInstance = TextProperty({ minLength: 10 })
        const getter = PropertyInstance.createGetter('hello')
        const validator = PropertyInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value="hello" and minLength=5 and maxLength=5', async () => {
        const PropertyInstance = TextProperty({ minLength: 5, maxLength: 5 })
        const getter = PropertyInstance.createGetter('hello')
        const validator = PropertyInstance.getValidator(getter)
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
        const getter = theProperty.createGetter(null)
        const actual = await getter()
        const expected = []
        assert.deepEqual(actual, expected)
      })
      it('should return the passed in defaultValue if set in config and null is passed', async () => {
        const theProperty = ArrayProperty({ defaultValue: [1, 2, 3] })
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
        const actual = await validator()
        const expected = []
        assert.deepEqual(actual, expected)
      })
      it('should error an array passed in when it doesnt have the right types', async () => {
        const theProperty = ArrayProperty({
          validators: [arrayType(TYPE_PRIMATIVES.integer)],
        })
        const getter = theProperty.createGetter([1, 'string', 3])
        const validator = theProperty.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.deepEqual(actual.length, expected)
      })
      it('should validate an array with [4,4,5,5,6,6] when choices are [4,5,6]', async () => {
        const theProperty = ArrayProperty({ choices: [4, 5, 6] })
        const getter = theProperty.createGetter([4, 4, 5, 5, 6, 6])
        const validator = theProperty.getValidator(getter)
        const actual = await validator()
        const expected = []
        assert.deepEqual(actual, expected)
      })
      it('should return errors when an array with [4,4,3,5,5,6,6] when choices are [4,5,6]', async () => {
        const theProperty = ArrayProperty({ choices: [4, 5, 6] })
        const getter = theProperty.createGetter([4, 4, 3, 5, 5, 6, 6])
        const validator = theProperty.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
    })
  })
  describe('#Property()', () => {
    it('should throw an exception if config.valueSelector is not a function but is set', () => {
      assert.throws(() => {
        Property('MyProperty', { valueSelector: 'blah' })
      })
    })
    it('should not throw an exception if config.valueSelector is a function', () => {
      assert.doesNotThrow(() => {
        Property('MyProperty', { valueSelector: () => ({}) })
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
        const getter = uniqueProperty.createGetter()
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
      const instance = proto.createGetter('my-date')
      assert.isOk(await instance())
    })
    it('should create a new date once when config.autoNow=true and called multiple times', async () => {
      const proto = DateProperty({ autoNow: true })
      const instance = proto.createGetter()
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
  })

  describe('#ReferenceProperty()', () => {
    it('should throw an exception if a model value is not passed in', () => {
      assert.throws(() => {
        const input = ['obj-id']
        const actual = ReferenceProperty(null, {})
      })
    })
    describe('#meta.getReferencedModel()', () => {
      it('should return the same value passed in as the model', async () => {
        const property = ReferenceProperty(TestModel1)
        const actual = property.meta.getReferencedModel()
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
      it('should allow a function input for model to allow delayed creation', async () => {
        const property = ReferenceProperty(() => TestModel1)
        const actual = property.meta.getReferencedModel()
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
    })
    describe('#createGetter()', () => {
      it('should return "obj-id" when no fetcher is used', async () => {
        const input = ['obj-id']
        const actual = await ReferenceProperty(TestModel1, {}).createGetter(
          ...input
        )()
        const expected = 'obj-id'
        assert.equal(actual, expected)
      })
      it('should allow null as the input', async () => {
        const input = [null]
        const actual = await ReferenceProperty(TestModel1, {}).createGetter(
          ...input
        )()
        const expected = null
        assert.equal(actual, expected)
      })
      it('should return "obj-id" from {}.id when no fetcher is used', async () => {
        const input = [{ id: 'obj-id' }]
        const actual = await ReferenceProperty(TestModel1, {}).createGetter(
          ...input
        )()
        const expected = 'obj-id'
        assert.equal(actual, expected)
      })
      it('should return name:"switch-a-roo" when switch-a-roo fetcher is used', async () => {
        const input = ['obj-id']
        const actual = await ReferenceProperty(TestModel1, {
          fetcher: () => ({ id: 'obj-id', name: 'switch-a-roo' }),
        }).createGetter(...input)()
        const expected = 'switch-a-roo'
        assert.deepEqual(await actual.getName(), expected)
      })
      it('should provide the passed in model and the instance values when switch-a-roo fetcher is used', async () => {
        const input = ['obj-id']
        const fetcher = sinon.stub().callsFake((modelName, id) => ({ id }))
        await ReferenceProperty(TestModel1, {
          fetcher,
        }).createGetter(...input)()
        const actual = fetcher.getCall(0).args[0]
        const expected = TestModel1
        assert.deepEqual(actual, expected)
      })
      it('should take the smartObject as a value', async () => {
        const proto = Model('name', {
          id: UniqueId({ value: 'obj-id' }),
        })
        const input = [proto.create({ id: 'obj-id' })]
        const instance = await ReferenceProperty(TestModel1, {}).createGetter(
          ...input
        )()
        const actual = await instance.getId()
        const expected = 'obj-id'
        assert.deepEqual(actual, expected)
      })
      describe('#functions.toObj()', () => {
        it('should use the getId of the smartObject passed in when toObj is called', async () => {
          const proto = Model('name', {
            id: UniqueId({ value: 'obj-id' }),
          })
          const input = [proto.create({ id: 'obj-id' })]
          const instance = await ReferenceProperty(TestModel1, {}).createGetter(
            ...input
          )()
          const actual = await instance.functions.toObj()
          const expected = 'obj-id'
          assert.deepEqual(actual, expected)
        })
        it('should return "obj-id" when switch-a-roo fetcher is used and toObj is called', async () => {
          const input = ['obj-id']
          const instance = await ReferenceProperty(TestModel1, {
            fetcher: () => ({ id: 'obj-id', prop: 'switch-a-roo' }),
          }).createGetter(...input)()
          const actual = await instance.functions.toObj()
          const expected = 'obj-id'
          assert.deepEqual(actual, expected)
        })
      })
    })
  })
})
