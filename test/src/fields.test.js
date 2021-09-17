const assert = require('chai').assert
const {
  uniqueId,
  field,
  dateField,
  referenceField,
} = require('../../src/fields')
const { createModel } = require('../../src/models')

describe('/src/fields.js', () => {
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
