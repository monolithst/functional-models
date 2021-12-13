import { assert } from 'chai'
import sinon from 'sinon'
import { Model } from '../../src/models'
import { TextProperty, Property } from '../../src/properties'
import { InstanceMethod } from '../../src/methods'

type TEST_MODEL_TYPE = { text: string}

describe('/src/functions.js', () => {
  describe('#InstanceMethod()', () => {
    it('should return "Hello-world" when passed in', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input.get.text()}-world`
      })
      const myInstanceMethod = InstanceMethod<TEST_MODEL_TYPE>(method)
      const wrappedObj = 'Hello'
      const model = Model<TEST_MODEL_TYPE>('Test', {properties:{ text: TextProperty()}})
      const modelInstance = model.create({text: 'Hello'})
      const actual = myInstanceMethod(modelInstance)
      const expected = 'Hello-world'
      assert.equal(actual, expected)
    })
    it('should call the method when InstanceMethod()() called', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myInstanceMethod = InstanceMethod<TEST_MODEL_TYPE>(method)
      const model = Model<TEST_MODEL_TYPE>('Test', {properties:{ text: TextProperty()}})
      const modelInstance = model.create({text: 'Hello'})
      const actual = myInstanceMethod(modelInstance)
      sinon.assert.calledOnce(method)
    })
    it('should not call the method when InstanceMethod() called', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myInstanceMethod = InstanceMethod<TEST_MODEL_TYPE>(method)
      sinon.assert.notCalled(method)
    })
  })
})
