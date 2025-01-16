import { assert } from 'chai'
import { isModelInstance } from '../../src/lib'

describe('/src/lib.ts', () => {
  describe('#isModelInstance()', () => {
    it('should return false if undefined is passed in', () => {
      const actual = isModelInstance(undefined)
      assert.isFalse(actual)
    })
    it('should return false if undefined is passed in', () => {
      // @ts-ignore
      const actual = isModelInstance()
      assert.isFalse(actual)
    })
    it('should return true if object has getPrimaryKey()', () => {
      const actual = isModelInstance({
        getPrimaryKey: () => {},
      })
      assert.isTrue(actual)
    })
  })
})
