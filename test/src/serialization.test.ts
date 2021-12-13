import {assert} from 'chai'
import { toJsonAble } from '../../src/serialization'

describe('/src/serialization.ts', () => {
  describe('#toObj()', () => {
    it('serialize a very basic input of key-value', async () => {
      const actual = await toJsonAble({
        key: () => 'value',
        key2: () => 'value2',
      })()
      const expected = {
        key: 'value',
        key2: 'value2',
      }
      assert.deepEqual(actual, expected)
    })
    it('should call "toObj" on nested objects', async () => {
      const actual = await toJsonAble({
        key: () => 'value',
        key2: () => ({
          get: { complex: () => ({ func: 'func' }) },
          toObj: () => ({ func: 'value' }),
        }),
      })()
      const expected = {
        key: 'value',
        key2: {
          func: 'value',
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should call "toObj" on very nested objects', async () => {
      const actual = await toJsonAble({
        key: () => 'value',
        key2: () => ({
          toObj: () => ({ func: 'value' }),
        }),
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
      const actual = await toJsonAble({
        key: () => 'value',
        key2: () => undefined,
      })()
      const expected = {
        key: 'value',
        key2: null,
      }
      assert.deepEqual(actual, expected)
    })
    it('should use the value null for null', async () => {
      const actual = await toJsonAble({
        key: () => 'value',
        key2: () => null,
      })()
      const expected = {
        key: 'value',
        key2: null,
      }
      assert.deepEqual(actual, expected)
    })
    it('should return "2021-09-16T21:51:56.039Z" for the set date.', async () => {
      const actual = await toJsonAble({
        myDate: () => new Date('2021-09-16T21:51:56.039Z'),
      })()
      const expected = {
        myDate: '2021-09-16T21:51:56.039Z',
      }
      assert.deepEqual(actual, expected)
    })
  })
})
