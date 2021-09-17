const assert = require('chai').assert
const {
  isNumber,
  isBoolean,
  isInteger,
  isString,
  isRequired,
  maxNumber,
  minNumber,
  choices,
  maxTextLength,
  minTextLength,
  meetsRegex,
  aggregateValidator,
  emptyValidator,
  createPropertyValidate,
} = require('../../src/validation')

describe('/src/validation.js', () => {
  describe('#isNumber()', () => {
    it('should return an error when empty is passed', () => {
      const actual = isNumber(null)
      assert.isOk(actual)
    })
    it('should return an error when "asdf" is passed', () => {
      const actual = isNumber('asdf')
      assert.isOk(actual)
    })
    it('should return undefined when 1 is passed', () => {
      const actual = isNumber(1)
      assert.isUndefined(actual)
    })
    it('should return error when "1" is passed', () => {
      const actual = isNumber('1')
      assert.isOk(actual)
    })
  })
  describe('#isString()', () => {
    it('should return undefined when "1" is passed', () => {
      const actual = isString('1')
      assert.isUndefined(actual)
    })
    it('should return error when 1 is passed', () => {
      const actual = isString(1)
      assert.isOk(actual)
    })
  })
  describe('#isRequired()', () => {
    it('should return undefined when 1 is passed', () => {
      const actual = isRequired(1)
      assert.isUndefined(actual)
    })
    it('should return undefined when 0 is passed', () => {
      const actual = isRequired(0)
      assert.isUndefined(actual)
    })
    it('should return undefined when "something" is passed', () => {
      const actual = isRequired('something')
      assert.isUndefined(actual)
    })
    it('should return error when null is passed', () => {
      const actual = isRequired(null)
      assert.isOk(actual)
    })
    it('should return error when undefined is passed', () => {
      const actual = isRequired(undefined)
      assert.isOk(actual)
    })
    it('should return undefined when false is passed', () => {
      const actual = isRequired(false)
      assert.isUndefined(actual)
    })
    it('should return undefined when true is passed', () => {
      const actual = isRequired(true)
      assert.isUndefined(actual)
    })
  })
  describe('#isBoolean()', () => {
    it('should return error when "true" is passed"', () => {
      const actual = isBoolean('true')
      assert.isOk(actual)
    })
    it('should return an error when "false" is passed', () => {
      const actual = isBoolean('false')
      assert.isOk(actual)
    })
    it('should return undefined when true is passed"', () => {
      const actual = isBoolean(true)
      assert.isUndefined(actual)
    })
    it('should return undefined when false is passed', () => {
      const actual = isBoolean(false)
      assert.isUndefined(actual)
    })
  })
  describe('#maxNumber()', () => {
    it('should return error if max=5 and value="hello world"', () => {
      const actual = maxNumber(5)('hello world')
      assert.isOk(actual)
    })
    it('should return error if max=5 and value=6', () => {
      const actual = maxNumber(5)(6)
      assert.isOk(actual)
    })
    it('should return undefined if max=5 and value=5', () => {
      const actual = maxNumber(5)(5)
      assert.isUndefined(actual)
    })
    it('should return undefined if max=5 and value=4', () => {
      const actual = maxNumber(5)(4)
      assert.isUndefined(actual)
    })
  })
  describe('#minNumber()', () => {
    it('should return error if min=5 and value="hello world"', () => {
      const actual = minNumber(5)('hello world')
      assert.isOk(actual)
    })
    it('should return error if min=5 and value=4', () => {
      const actual = minNumber(5)(4)
      assert.isOk(actual)
    })
    it('should return undefined if min=5 and value=4', () => {
      const actual = minNumber(5)(5)
      assert.isUndefined(actual)
    })
    it('should return undefined if min=5 and value=6', () => {
      const actual = minNumber(5)(6)
      assert.isUndefined(actual)
    })
  })
  describe('#choices()', () => {
    it('should return an error if choices are [1,2,3] and value is 4', () => {
      const actual = choices([1, 2, 3])(4)
      assert.isOk(actual)
    })
    it('should return undefined if choices are [1,2,3] and value is 1', () => {
      const actual = choices([1, 2, 3])(1)
      assert.isUndefined(actual)
    })
  })
  describe('#minTextLength()', () => {
    it('should return error if min=5 and value=5', () => {
      const actual = minTextLength(5)(5)
      assert.isOk(actual)
    })
    it('should return error if length=5 and value="asdf"', () => {
      const actual = minTextLength(5)('asdf')
      assert.isOk(actual)
    })
    it('should return undefined if length=5 and value="hello"', () => {
      const actual = minTextLength(5)('hello')
      assert.isUndefined(actual)
    })
    it('should return undefined if length=5 and value="hello world"', () => {
      const actual = minTextLength(5)('hello world')
      assert.isUndefined(actual)
    })
  })
  describe('#maxTextLength()', () => {
    it('should return error if max=5 and value=5', () => {
      const actual = maxTextLength(5)(5)
      assert.isOk(actual)
    })
    it('should return error if length=5 and value="hello world"', () => {
      const actual = maxTextLength(5)('hello world')
      assert.isOk(actual)
    })
    it('should return undefined if length=5 and value="hello"', () => {
      const actual = maxTextLength(5)('hello')
      assert.isUndefined(actual)
    })
    it('should return undefined if length=5 and value="asdf"', () => {
      const actual = maxTextLength(5)('asdf')
      assert.isUndefined(actual)
    })
  })
  describe('#meetsRegex()', () => {
    it('should return an error with regex=/asdf/ flags="g" and value="hello world"', () => {
      const actual = meetsRegex(/asdf/, 'g')('hello world')
      assert.isOk(actual)
    })
    it('should return undefined with regex=/asdf/ flags="g" and value="hello asdf world"', () => {
      const actual = meetsRegex(/asdf/, 'g')('asdf')
      assert.isUndefined(actual)
    })
  })
  describe('#aggregateValidator()', () => {
    it('should return two errors when two validators are passed, and the value fails both', async () => {
      const validators = [minTextLength(10), isNumber]
      const value = 'asdf'
      const actual = (await aggregateValidator(validators)('asdf')).length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return one error when one validator is passed, and the value fails', async () => {
      const validators = minTextLength(10)
      const value = 'asdf'
      const actual = (await aggregateValidator(validators)('asdf')).length
      const expected = 1
      assert.equal(actual, expected)
    })
  })
  describe('#createPropertyValidate()', () => {
    it('should result in {}.functions.validate.myProperty when key="myProperty"', () => {
      const actual = createPropertyValidate('myProperty', {})('value')
      assert.isOk(actual.functions.validate.myProperty)
    })
    it('should create a isRequired validator when config contains isRequired=true', async () => {
      const property = createPropertyValidate('myProperty', { required: true })(
        null
      )
      const actual = (await property.functions.validate.myProperty()).length
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should not use isRequired validator when config contains isRequired=false', async () => {
      const property = createPropertyValidate('myProperty', {
        required: false,
      })(null)
      const actual = (await property.functions.validate.myProperty()).length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should use the validators passed in', async () => {
      const property = createPropertyValidate('myProperty', {
        validators: [maxTextLength(5)],
      })('hello world')
      const actual = (await property.functions.validate.myProperty()).length
      const expected = 1
      assert.equal(actual, expected)
    })
  })
  describe('#emptyValidator()', () => {
    it('should return an empty array with a value of 1', () => {
      const actual = emptyValidator(1).length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should return an empty array with a value of "1"', () => {
      const actual = emptyValidator('1').length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should return an empty array with a value of true', () => {
      const actual = emptyValidator(true).length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should return an empty array with a value of false', () => {
      const actual = emptyValidator(false).length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should return an empty array with a value of undefined', () => {
      const actual = emptyValidator(undefined).length
      const expected = 0
      assert.equal(actual, expected)
    })
  })
  describe('#isInteger()', () => {
    it('should return an error with a value of "1"', () => {
      const actual = isInteger('1')
      assert.isOk(actual)
    })
    it('should return undefined with a value of 1', () => {
      const actual = isInteger(1)
      assert.isUndefined(actual)
    })
  })
})
