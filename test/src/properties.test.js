const assert = require('chai').assert
const { property, named, typed, uniqueId } = require('../../src/properties')

describe('/src/properties.js', () => {
  describe('#uniqueId()', () => {
    describe('#getId()', () => {
      it('should use the id passed in', () => {
        const actual = uniqueId('passed-in').getId()
        const expected = 'passed-in'
        assert.equal(actual, expected)
      })
      it('should create an id if null is passed in', () => {
        const actual = uniqueId().getId()
        assert.isOk(actual)
      })
    })
  })
  describe('#property()', () => {
    it('should take an arg that is a function', async () => {
      const instance = property('property', () => 'hello world')
      const actual = await instance.getProperty()
    })
    it('should return an object that has a key "getKey" that returns "value" when "Key" is passed in', () => {
      const actual = property('Key', 'value')
      const [actualKey, actualValue] = Object.entries(actual)[0]
      const expectedKey = 'getKey'
      const expectedValue = 'value'
      assert.equal(actualKey, expectedKey)
      assert.equal(actualValue(), expectedValue)
    })
    it('should return an object that has a key "getUpperCased" that returns "value" when {upperCased: "value"} is passed in', () => {
      const actual = property({ upperCased: 'value' })
      const [actualKey, actualValue] = Object.entries(actual)[0]
      const expectedKey = 'getUpperCased'
      const expectedValue = 'value'
      assert.equal(actualKey, expectedKey)
      assert.equal(actualValue(), expectedValue)
    })
  })
  describe('#named()', () => {
    it('should return an object with a key "getName" that returns "name" when "name" is passed in', () => {
      const actual = named('name')
      const [actualKey, actualValue] = Object.entries(actual)[0]
      const expectedKey = 'getName'
      const expectedValue = 'name'
      assert.equal(actualKey, expectedKey)
      assert.equal(actualValue(), expectedValue)
    })
  })
  describe('#typed()', () => {
    it('should return an object with a key "getType" that returns "theType" when "theType" is passed in', () => {
      const actual = typed('theType')
      const [actualKey, actualValue] = Object.entries(actual)[0]
      const expectedKey = 'getType'
      const expectedValue = 'theType'
      assert.equal(actualKey, expectedKey)
      assert.equal(actualValue(), expectedValue)
    })
  })
})
