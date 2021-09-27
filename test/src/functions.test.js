const assert = require('chai').assert
const sinon = require('sinon')
const { Function } = require('../../src/functions')

describe('/src/functions.js', () => {
  describe('#Function()', () => {
    it('should return "Hello-world" when passed in', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myFunction = Function(method)
      const wrappedObj = 'Hello'
      const wrappedFunc = myFunction(wrappedObj)
      const actual = wrappedFunc()
      const expected = 'Hello-world'
      assert.equal(actual, expected)
    })
    it('should call the method when Function()()() called', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myFunction = Function(method)
      const wrappedObj = 'Hello'
      const wrappedFunc = myFunction(wrappedObj)
      const result = wrappedFunc()
      sinon.assert.calledOnce(method)
    })
    it('should not call the method when Function()() called', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myFunction = Function(method)
      const wrappedObj = 'Hello'
      const wrappedFunc = myFunction(wrappedObj)
      sinon.assert.notCalled(method)
    })
    it('should not call the method when Function() called', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myFunction = Function(method)
      sinon.assert.notCalled(method)
    })
  })
})
