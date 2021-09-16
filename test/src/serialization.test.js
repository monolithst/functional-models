const assert = require('chai').assert
const { toJson } = require('../../src/serialization')

describe('/src/serialization.js', () => {
  describe('#toJson()', () => {
    it('serialize a very basic input of key-value', async () => {
      const actual = await toJson({
        key: 'value',
        key2: 'value2',
      })()
      const expected = {
        key: 'value',
        key2: 'value2',
      }
      assert.deepEqual(actual, expected)
    })
    it('should ignore "meta" properties', async () => {
      const actual = await toJson({
        key: 'value',
        key2: 'value2',
        meta: {
          something: 'here',
        },
      })()
      const expected = {
        key: 'value',
        key2: 'value2',
      }
      assert.deepEqual(actual, expected)
    })
    it('should ignore "functions" properties', async () => {
      const actual = await toJson({
        key: 'value',
        key2: 'value2',
        functions: {
          something: () => {
            return 'here'
          },
        },
      })()
      const expected = {
        key: 'value',
        key2: 'value2',
      }
      assert.deepEqual(actual, expected)
    })
    it('should call "functions.toJson" on nested objects', async () => {
      const actual = await toJson({
        key: 'value',
        key2: {
          complex: () => ({ func: 'func' }),
          functions: {
            toJson: () => ({ func: 'value' }),
          },
        },
      })()
      const expected = {
        key: 'value',
        key2: {
          func: 'value',
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should call "toJson" on very nested objects', async () => {
      const actual = await toJson({
        key: 'value',
        key2: {
          functions: {
            toJson: () => ({ func: 'value' }),
          },
        },
      })()
      const expected = {
        key: 'value',
        key2: {
          func: 'value',
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should set an undefined property to null', async () => {
      const actual = await toJson({
        key: 'value',
        key2: undefined,
      })()
      const expected = {
        key: 'value',
        key2: null,
      }
      assert.deepEqual(actual, expected)
    })
    it('should get the value of a function', async () => {
      const actual = await toJson({
        key: 'value',
        key2: () => {
          return 'funcvalue'
        },
      })()
      const expected = {
        key: 'value',
        key2: 'funcvalue',
      }
      assert.deepEqual(actual, expected)
    })
    it('should change property getTheValue to "theValue"', async () => {
      const actual = await toJson({
        key: 'value',
        getTheValue: () => 'funcvalue',
      })()
      const expected = {
        key: 'value',
        theValue: 'funcvalue',
      }
      assert.deepEqual(actual, expected)
    })
    it('should return "2021-09-16T21:51:56.039Z" for the set date.', async () => {
      const actual = await toJson({
        myDate: new Date('2021-09-16T21:51:56.039Z'),
      })()
      const expected = {
        myDate: '2021-09-16T21:51:56.039Z',
      }
      assert.deepEqual(actual, expected)
    })
  })
})
