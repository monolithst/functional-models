import { assert } from 'chai'
import sinon from 'sinon'
import { BaseModel } from '../../src/models'
import { TextProperty, Property } from '../../src/properties'
import { WrapperInstanceMethod } from '../../src/methods'

type TEST_MODEL_TYPE = { text: string }

describe('/src/methods.js', () => {
  describe('#InstanceMethod()', () => {
    it('should return "Hello-world" when passed in', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input.get.text()}-world`
      })
      const myInstanceMethod = WrapperInstanceMethod<TEST_MODEL_TYPE>(method)
      const wrappedObj = 'Hello'
      const model = BaseModel<TEST_MODEL_TYPE>('Test', {
        properties: { text: TextProperty() },
      })
      const modelInstance = model.create({ text: 'Hello' })
      const actual = myInstanceMethod(modelInstance, model)
      const expected = 'Hello-world'
      assert.equal(actual, expected)
    })
    it('should call the method when InstanceMethod()() called', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myInstanceMethod = WrapperInstanceMethod<TEST_MODEL_TYPE>(method)
      const model = BaseModel<TEST_MODEL_TYPE>('Test', {
        properties: { text: TextProperty() },
      })
      const modelInstance = model.create({ text: 'Hello' })
      const actual = myInstanceMethod(modelInstance, model)
      sinon.assert.calledOnce(method)
    })
    it('should not call the method when InstanceMethod() called', () => {
      const method = sinon.stub().callsFake(input => {
        return `${input}-world`
      })
      const myInstanceMethod = WrapperInstanceMethod<TEST_MODEL_TYPE>(method)
      sinon.assert.notCalled(method)
    })
  })
})
