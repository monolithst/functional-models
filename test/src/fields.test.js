const assert = require('chai').assert
const {
  uniqueId,
  field,
  dateField,
  referenceField,
  arrayField,
  constantValueField,
  objectField,
  numberField,
  textField,
  integerField,
} = require('../../src/fields')
const { TYPE_PRIMATIVES, arrayType } = require('../../src/validation')
const { createModel } = require('../../src/models')

describe('/src/fields.js', () => {
  describe('#constantValueField()', () => {
    describe('#createGetter()', () => {
      it('should always have the value passed in', async () => {
        const fieldInstance = constantValueField('constant')
        const getter = fieldInstance.createGetter('changed')
        const actual = await getter()
        const expected = 'constant'
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const fieldInstance = constantValueField('constant')
        const getter = fieldInstance.createGetter('changed')
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })
  describe('#objectField()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          objectField()
        })
      })
      it('should be able to get the object passed in', async () => {
        const fieldInstance = objectField({})
        const getter = fieldInstance.createGetter({
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
        const fieldInstance = objectField({})
        const getter = fieldInstance.createGetter({
          my: 'object',
          complex: { it: 'is' },
        })
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#numberField()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          numberField()
        })
      })
      it('should be able to get the number passed in', async () => {
        const fieldInstance = numberField({})
        const getter = fieldInstance.createGetter(5)
        const actual = await getter()
        const expected = 5
        assert.equal(actual, expected)
      })
      it('should be able to get float passed in', async () => {
        const fieldInstance = numberField({})
        const getter = fieldInstance.createGetter(5.123)
        const actual = await getter()
        const expected = 5.123
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const fieldInstance = numberField({})
        const getter = fieldInstance.createGetter(5)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return and validate successful with a basic float', async () => {
        const fieldInstance = numberField({})
        const getter = fieldInstance.createGetter(5.123)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a non integer input', async () => {
        const fieldInstance = numberField({})
        const getter = fieldInstance.createGetter('string')
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5 and maxValue=3', async () => {
        const fieldInstance = numberField({ maxValue: 3 })
        const getter = fieldInstance.createGetter(5)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const fieldInstance = numberField({ minValue: 3 })
        const getter = fieldInstance.createGetter(2)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const fieldInstance = numberField({ minValue: 3, maxValue: 3 })
        const getter = fieldInstance.createGetter(3)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#integerField()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          integerField()
        })
      })
      it('should be able to get the number passed in', async () => {
        const fieldInstance = integerField({})
        const getter = fieldInstance.createGetter(5)
        const actual = await getter()
        const expected = 5
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const fieldInstance = integerField({})
        const getter = fieldInstance.createGetter(5)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return errors with a basic float', async () => {
        const fieldInstance = integerField({})
        const getter = fieldInstance.createGetter(5.123)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a non integer input', async () => {
        const fieldInstance = integerField({})
        const getter = fieldInstance.createGetter('string')
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5 and maxValue=3', async () => {
        const fieldInstance = integerField({ maxValue: 3 })
        const getter = fieldInstance.createGetter(5)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=2 and minValue=3', async () => {
        const fieldInstance = integerField({ minValue: 3 })
        const getter = fieldInstance.createGetter(2)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value=3 and minValue=3 and maxValue=3', async () => {
        const fieldInstance = integerField({ minValue: 3, maxValue: 3 })
        const getter = fieldInstance.createGetter(3)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#textField()', () => {
    describe('#createGetter()', () => {
      it('should be able to create without a config', () => {
        assert.doesNotThrow(() => {
          textField()
        })
      })
      it('should be able to get the value passed in', async () => {
        const fieldInstance = textField({})
        const getter = fieldInstance.createGetter('basic input')
        const actual = await getter()
        const expected = 'basic input'
        assert.equal(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should return and validate successful with basic input', async () => {
        const fieldInstance = textField({})
        const getter = fieldInstance.createGetter('basic input')
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value=5', async () => {
        const fieldInstance = textField({})
        const getter = fieldInstance.createGetter(5)
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value="hello" and maxLength=3', async () => {
        const fieldInstance = textField({ maxLength: 3 })
        const getter = fieldInstance.createGetter('hello')
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with errors with a value="hello" and minLength=10', async () => {
        const fieldInstance = textField({ minLength: 10 })
        const getter = fieldInstance.createGetter('hello')
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
      it('should return with no errors with a value="hello" and minLength=5 and maxLength=5', async () => {
        const fieldInstance = textField({ minLength: 5, maxLength: 5 })
        const getter = fieldInstance.createGetter('hello')
        const validator = fieldInstance.getValidator(getter)
        const actual = await validator()
        const expected = 0
        assert.equal(actual.length, expected)
      })
    })
  })

  describe('#arrayField()', () => {
    describe('#createGetter()', () => {
      it('should return an array passed in without issue', async () => {
        const theField = arrayField({})
        const getter = theField.createGetter([1, 2, 3])
        const actual = await getter()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
      it('should return an array passed in without issue, even if no config is passed', async () => {
        const theField = arrayField()
        const getter = theField.createGetter([1, 2, 3])
        const actual = await getter()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
      it('should return an empty array if defaultValue is not changed in config and null is passed', async () => {
        const theField = arrayField()
        const getter = theField.createGetter(null)
        const actual = await getter()
        const expected = []
        assert.deepEqual(actual, expected)
      })
      it('should return the passed in defaultValue if set in config and null is passed', async () => {
        const theField = arrayField({ defaultValue: [1, 2, 3] })
        const getter = theField.createGetter(null)
        const actual = await getter()
        const expected = [1, 2, 3]
        assert.deepEqual(actual, expected)
      })
    })
    describe('#getValidator()', () => {
      it('should validate an array passed in without issue', async () => {
        const theField = arrayField({})
        const getter = theField.createGetter([1, 2, 3])
        const validator = theField.getValidator(getter)
        const actual = await validator()
        const expected = []
        assert.deepEqual(actual, expected)
      })
      it('should error an array passed in when it doesnt have the right types', async () => {
        const theField = arrayField({
          validators: [arrayType(TYPE_PRIMATIVES.integer)],
        })
        const getter = theField.createGetter([1, 'string', 3])
        const validator = theField.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.deepEqual(actual.length, expected)
      })
      it('should validate an array with [4,4,5,5,6,6] when choices are [4,5,6]', async () => {
        const theField = arrayField({ choices: [4, 5, 6] })
        const getter = theField.createGetter([4, 4, 5, 5, 6, 6])
        const validator = theField.getValidator(getter)
        const actual = await validator()
        const expected = []
        assert.deepEqual(actual, expected)
      })
      it('should return errors when an array with [4,4,3,5,5,6,6] when choices are [4,5,6]', async () => {
        const theField = arrayField({ choices: [4, 5, 6] })
        const getter = theField.createGetter([4, 4, 3, 5, 5, 6, 6])
        const validator = theField.getValidator(getter)
        const actual = await validator()
        const expected = 1
        assert.equal(actual.length, expected)
      })
    })
  })
  describe('#field()', () => {
    it('should throw an exception if config.valueSelector is not a function but is set', () => {
      assert.throws(() => {
        field({ valueSelector: 'blah' })
      })
    })
    it('should not throw an exception if config.valueSelector is a function', () => {
      assert.doesNotThrow(() => {
        field({ valueSelector: () => ({}) })
      })
    })
    describe('#createGetter()', () => {
      it('should return a function even if config.value is set to a value', () => {
        const instance = field({ value: 'my-value' })
        const actual = instance.createGetter('not-my-value')
        assert.isFunction(actual)
      })
      it('should return the value passed into config.value regardless of what is passed into the createGetter', async () => {
        const instance = field({ value: 'my-value' })
        const actual = await instance.createGetter('not-my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value passed into createGetter when config.value is not set', async () => {
        const instance = field()
        const actual = await instance.createGetter('my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
      it('should return the value of the function passed into createGetter when config.value is not set', async () => {
        const instance = field()
        const actual = await instance.createGetter(() => 'my-value')()
        const expected = 'my-value'
        assert.deepEqual(actual, expected)
      })
    })
  })
  describe('#uniqueId()', () => {
    describe('#createGetter()', () => {
      it('should call createUuid only once even if called twice', async () => {
        const uniqueField = uniqueId({})
        const getter = uniqueField.createGetter()
        const first = await getter()
        const second = await getter()
        assert.deepEqual(first, second)
      })
      it('should use the uuid passed in', async () => {
        const uniqueField = uniqueId({})
        const getter = uniqueField.createGetter('my-uuid')
        const actual = await getter()
        const expected = 'my-uuid'
        assert.deepEqual(actual, expected)
      })
    })
  })
  describe('#dateField()', () => {
    it('should create a new date once when config.autoNow=true and called multiple times', async () => {
      const proto = dateField({ autoNow: true })
      const instance = proto.createGetter()
      const first = await instance()
      const second = await instance()
      const third = await instance()
      assert.deepEqual(first, second)
      assert.deepEqual(first, third)
    })
    it('should use the date passed in', async () => {
      const proto = dateField({ autoNow: true })
      const date = new Date()
      const instance = proto.createGetter(date)
      const actual = await instance()
      const expected = date
      assert.deepEqual(actual, expected)
    })
  })

  describe('#referenceField()', () => {
    describe('#createGetter()', () => {
      it('should return "obj-id" when no fetcher is used', async () => {
        const input = ['obj-id']
        const actual = await referenceField({}).createGetter(...input)()
        const expected = 'obj-id'
        assert.equal(actual, expected)
      })
      it('should allow null as the input', async () => {
        const input = [null]
        const actual = await referenceField({}).createGetter(...input)()
        const expected = null
        assert.equal(actual, expected)
      })
      it('should return "obj-id" from {}.id when no fetcher is used', async () => {
        const input = [{ id: 'obj-id' }]
        const actual = await referenceField({}).createGetter(...input)()
        const expected = 'obj-id'
        assert.equal(actual, expected)
      })
      it('should return prop: "switch-a-roo" when switch-a-roo fetcher is used', async () => {
        const input = ['obj-id']
        const actual = await referenceField({
          fetcher: () => ({ id: 'obj-id', prop: 'switch-a-roo' }),
        }).createGetter(...input)()
        const expected = 'switch-a-roo'
        assert.deepEqual(actual.prop, expected)
      })
      it('should combine functions when switch-a-roo fetcher is used', async () => {
        const input = ['obj-id']
        const instance = await referenceField({
          fetcher: () => ({
            id: 'obj-id',
            prop: 'switch-a-roo',
            functions: { myfunc: 'ok' },
          }),
        }).createGetter(...input)()
        const actual = instance.functions.myfunc
        const expected = 'ok'
        assert.deepEqual(actual, expected)
      })
      it('should take the smartObject as a value', async () => {
        const proto = createModel({
          id: uniqueId({ value: 'obj-id' }),
        })
        const input = [proto({ id: 'obj-id' })]
        const instance = await referenceField({}).createGetter(...input)()
        const actual = await instance.getId()
        const expected = 'obj-id'
        assert.deepEqual(actual, expected)
      })
      describe('#functions.toJson()', () => {
        it('should use the getId of the smartObject passed in when toJson is called', async () => {
          const proto = createModel({
            id: uniqueId({ value: 'obj-id' }),
          })
          const input = [proto({ id: 'obj-id' })]
          const instance = await referenceField({}).createGetter(...input)()
          const actual = await instance.functions.toJson()
          const expected = 'obj-id'
          assert.deepEqual(actual, expected)
        })
        it('should return "obj-id" when switch-a-roo fetcher is used and toJson is called', async () => {
          const input = ['obj-id']
          const instance = await referenceField({
            fetcher: () => ({ id: 'obj-id', prop: 'switch-a-roo' }),
          }).createGetter(...input)()
          const actual = await instance.functions.toJson()
          const expected = 'obj-id'
          assert.deepEqual(actual, expected)
        })
      })
    })
  })
})
