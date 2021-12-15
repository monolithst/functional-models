import { assert } from 'chai'
import { ValidationError } from '../../src/errors'

describe('/src/errors.ts', () => {
  describe('ValidationError', () => {
    it('should have the correct modelName', () => {
      const instance = new ValidationError('modelName', {
        name: ['error1', 'error2'],
      })
      const actual = instance.modelName
      const expected = 'modelName'
      assert.equal(actual, expected)
    })
    it('should have the correct keysToErrors', () => {
      const instance = new ValidationError('modelName', {
        name: ['error1', 'error2'],
      })
      const actual = instance.keysToErrors
      const expected = { name: ['error1', 'error2'] }
      assert.deepEqual(actual, expected)
    })
    it('should have the correct name', () => {
      const instance = new ValidationError('modelName', {
        name: ['error1', 'error2'],
      })
      const actual = instance.name
      const expected = 'ValidationError'
      assert.equal(actual, expected)
    })
  })
})
