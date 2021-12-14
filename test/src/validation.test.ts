import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import sinon from 'sinon'
import { Model } from '../../src/models'
import { UniqueId, TextProperty } from '../../src/properties'
import {
  isNumber,
  isBoolean,
  isInteger,
  isString,
  isArray,
  isDate,
  arrayType,
  isRequired,
  maxNumber,
  minNumber,
  choices,
  maxTextLength,
  minTextLength,
  meetsRegex,
  aggregateValidator,
  referenceTypeMatch,
  emptyValidator,
  createModelValidator,
  createPropertyValidator,
  TYPE_PRIMATIVES,
} from '../../src/validation'
import { IModelComponentValidator } from '../../src/interfaces'

const assert = chai.assert

const TestModel1 = Model('TestModel1', {
  properties: {},
})

const TestModel2 = Model('TestModel2', {
  properties: {},
})

const createTestModel3 = (modelValidators: IModelComponentValidator[]) =>
  Model<{ name: string }>('TestModel3', {
    properties: {
      name: TextProperty(),
    },
    modelValidators,
  })

type EMPTY_MODEL = {}
const EMPTY_MODEL_INSTANCE = Model<EMPTY_MODEL>('EmptyModel', {
  properties: {},
}).create({})

describe('/src/validation.ts', () => {
  describe('#isDate()', () => {
    it('should return an error if value is null', () => {
      // @ts-ignore
      const actual = isDate(null, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return an error if value is undefined', () => {
      // @ts-ignore
      const actual = isDate(undefined, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return an error object does not have toISOString', () => {
      // @ts-ignore
      const actual = isDate({}, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined if a date', () => {
      const actual = isDate(new Date(), EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#referenceTypeMatch()', () => {
    it('should return an error if undefined is passed as a value', () => {
      const myModel = TestModel1.create({})
      const actual = referenceTypeMatch(TestModel1)(
        // @ts-ignore
        undefined,
        EMPTY_MODEL_INSTANCE,
        {}
      )
      assert.isOk(actual)
    })
    it('should return an error if null is passed as a value', () => {
      const myModel = TestModel1.create({})
      const actual = referenceTypeMatch(TestModel1)(
        // @ts-ignore
        null,
        EMPTY_MODEL_INSTANCE,
        {}
      )
      assert.isOk(actual)
    })
    it('should allow a function for a model', () => {
      const myModel = TestModel1.create({})
      const actual = referenceTypeMatch(() => TestModel1)(
        myModel,
        EMPTY_MODEL_INSTANCE,
        {}
      )
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should validate when the correct object matches the model', () => {
      const myModel = TestModel1.create({})
      const actual = referenceTypeMatch(TestModel1)(
        myModel,
        EMPTY_MODEL_INSTANCE,
        {}
      )
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return an error when the input does not match the model', () => {
      const myModel = TestModel2.create({})
      const actual = referenceTypeMatch(TestModel1)(
        myModel,
        EMPTY_MODEL_INSTANCE,
        {}
      )
      assert.isOk(actual)
    })
  })
  describe('#isNumber()', () => {
    it('should return an error when empty is passed', () => {
      const actual = isNumber(null, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return an error when "asdf" is passed', () => {
      const actual = isNumber('asdf', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined when 1 is passed', () => {
      const actual = isNumber(1, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return error when "1" is passed', () => {
      const actual = isNumber('1', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
  })
  describe('#isString()', () => {
    it('should return undefined when "1" is passed', () => {
      const actual = isString('1', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return error when 1 is passed', () => {
      const actual = isString(1, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
  })
  describe('#isRequired()', () => {
    it('should return undefined when 1 is passed', () => {
      const actual = isRequired(1, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined when a date is passed', () => {
      const actual = isRequired(new Date(), EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined when 0 is passed', () => {
      const actual = isRequired(0, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined when "something" is passed', () => {
      const actual = isRequired('something', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return error when null is passed', () => {
      const actual = isRequired(null, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return error when undefined is passed', () => {
      const actual = isRequired(undefined, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined when false is passed', () => {
      const actual = isRequired(false, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined when true is passed', () => {
      const actual = isRequired(true, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#isBoolean()', () => {
    it('should return error when "true" is passed"', () => {
      const actual = isBoolean('true', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return an error when "false" is passed', () => {
      const actual = isBoolean('false', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined when true is passed"', () => {
      const actual = isBoolean(true, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined when false is passed', () => {
      const actual = isBoolean(false, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#maxNumber()', () => {
    it('should return error if max=5 and value="hello world"', () => {
      // @ts-ignore
      const actual = maxNumber(5)('hello world', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return error if max=5 and value=6', () => {
      const actual = maxNumber(5)(6, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined if max=5 and value=5', () => {
      const actual = maxNumber(5)(5, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined if max=5 and value=4', () => {
      const actual = maxNumber(5)(4, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#minNumber()', () => {
    it('should return error if min=5 and value="hello world"', () => {
      // @ts-ignore
      const actual = minNumber(5)('hello world', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return error if min=5 and value=4', () => {
      const actual = minNumber(5)(4, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined if min=5 and value=4', () => {
      const actual = minNumber(5)(5, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined if min=5 and value=6', () => {
      const actual = minNumber(5)(6, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#choices()', () => {
    it('should return an error if choices are [1,2,3] and value is 4', () => {
      const actual = choices(['1', '2', '3'])('4', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined if choices are [1,2,3] and value is 1', () => {
      const actual = choices(['1', '2', '3'])('1', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#minTextLength()', () => {
    it('should return error if min=5 and value=5', () => {
      // @ts-ignore
      const actual = minTextLength(5)(5, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return error if min=5 and value=5', () => {
      const actual = minTextLength(5)('5', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return error if length=5 and value="asdf"', () => {
      const actual = minTextLength(5)('asdf', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined if length=5 and value="hello"', () => {
      const actual = minTextLength(5)('hello', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined if length=5 and value="hello world"', () => {
      const actual = minTextLength(5)('hello world', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#maxTextLength()', () => {
    it('should return error if length=5 and value=5', () => {
      // @ts-ignore
      const actual = maxTextLength(5)(5, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return error if length=5 and value="hello world"', () => {
      const actual = maxTextLength(5)('hello world', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined if length=5 and value="hello"', () => {
      const actual = maxTextLength(5)('hello', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined if length=5 and value="asdf"', () => {
      const actual = maxTextLength(5)('asdf', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#meetsRegex()', () => {
    it('should return an error with regex=/asdf/ flags="g" and value="hello world"', () => {
      const actual = meetsRegex(/asdf/, 'g')(
        'hello world',
        EMPTY_MODEL_INSTANCE,
        {}
      )
      assert.isOk(actual)
    })
    it('should return undefined with regex=/asdf/ flags="g" and value="hello asdf world"', () => {
      const actual = meetsRegex(/asdf/, 'g')('asdf', EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#aggregateValidator()', () => {
    it('should return two errors when two validators are passed, and the value fails both', async () => {
      const validators = [minTextLength(10), isNumber]
      const value = 'asdf'
      const actual = (
        await aggregateValidator(value, validators)(EMPTY_MODEL_INSTANCE, {})
      ).length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return one error when one validator is passed, and the value fails', async () => {
      const validators = minTextLength(10)
      const value = 'asdf'
      const actual = (
        await aggregateValidator(value, validators)(EMPTY_MODEL_INSTANCE, {})
      ).length
      const expected = 1
      assert.equal(actual, expected)
    })
  })
  describe('#emptyValidator()', () => {
    it('should return undefined with a value of 1', () => {
      const actual = emptyValidator(1, EMPTY_MODEL_INSTANCE, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of "1"', () => {
      const actual = emptyValidator('1', EMPTY_MODEL_INSTANCE, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of true', () => {
      const actual = emptyValidator(true, EMPTY_MODEL_INSTANCE, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of false', () => {
      const actual = emptyValidator(false, EMPTY_MODEL_INSTANCE, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of undefined', () => {
      const actual = emptyValidator(undefined, EMPTY_MODEL_INSTANCE, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
  })
  describe('#isInteger()', () => {
    it('should return an error with a value of "1"', () => {
      const actual = isInteger('1', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined with a value of 1', () => {
      const actual = isInteger(1, EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#createModelValidator()', () => {
    it('should throw an exception if instance is null', () => {
      const modelValidator = sinon.stub().returns(undefined)
      const properties = {
        id: sinon.stub().returns(undefined),
        name: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties, [modelValidator])
      // @ts-ignore
      assert.isRejected(validator(undefined, {}))
    })
    it('should call the model validator passed in', async () => {
      const modelValidator = sinon.stub().returns(undefined)
      const testModel3 = createTestModel3([modelValidator])
      const properties = {
        id: sinon.stub().returns(undefined),
        name: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties, [modelValidator])
      await validator(
        testModel3.create({
          id: 'test-id',
          name: 'my-name',
        }),
        {
          id: 'test-id',
          name: 'my-name',
        }
      )
      sinon.assert.calledOnce(modelValidator)
    })
    it('should pass the instance into the validator as the first argument', async () => {
      const modelValidator = sinon.stub().returns(undefined)
      const testModel3 = createTestModel3([modelValidator])
      const properties = {
        id: sinon.stub().returns(undefined),
        name: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties, [modelValidator])
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      await validator(instance, {})

      const actual = modelValidator.getCall(0).args[0]
      const expected = instance
      assert.deepEqual(actual, expected)
    })
    it('should pass the instance data into the validator as the second argument', async () => {
      const modelValidator = sinon.stub().returns(undefined)
      const testModel3 = createTestModel3([modelValidator])
      const properties = {
        id: sinon.stub().returns(undefined),
        name: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties, [modelValidator])
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      const expected = await instance.toObj()
      await validator(instance, {})

      const actual = modelValidator.getCall(0).args[1]
      assert.deepEqual(actual, expected)
    })
    it('should return a overall: ["my-validation-error"] when the model validator returns "my-validation-error"', async () => {
      const modelValidator = sinon.stub().returns('my-validation-error')
      const testModel3 = createTestModel3([modelValidator])
      const properties = {
        id: sinon.stub().returns(undefined),
        name: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties, [modelValidator])
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      const actual = await validator(instance, {})
      const expected = {
        overall: ['my-validation-error'],
      }
      assert.deepEqual(actual, expected)
    })
    it('should return no errors when two model validators return undefined', async () => {
      const modelValidator1 = sinon.stub().resolves(undefined)
      const modelValidator2 = sinon.stub().resolves(undefined)
      const testModel3 = createTestModel3([modelValidator1, modelValidator2])
      const properties = {
        id: sinon.stub().returns(undefined),
        name: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties, [
        modelValidator1,
        modelValidator2,
      ])
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      const actual = await validator(instance, {})
      const expected = {}
      assert.deepEqual(actual, expected)
    })
    it('should use both functions.validate for two objects', async () => {
      const properties = {
        id: sinon.stub().returns(undefined),
        type: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties)
      const testModel3 = Model('Model', { properties: {} })
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      await validator(instance, {})
      sinon.assert.calledOnce(properties.id)
      sinon.assert.calledOnce(properties.type)
    })
    it('should run a validators.model() function', async () => {
      const properties = {
        id: sinon.stub().returns(undefined),
        type: sinon.stub().returns(undefined),
        model: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator(properties)
      const testModel3 = Model('Model', { properties: {} })
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      await validator(instance, {})
      sinon.assert.called(properties.model)
    })
    it('should combine results for both validators for two objects that error', async () => {
      const properties = {
        id: sinon.stub().returns(['error1']),
        type: sinon.stub().returns(['error2']),
      }
      const validator = createModelValidator(properties)
      const testModel3 = Model('Model', { properties: {} })
      const instance = testModel3.create({
        id: 'test-id',
        type: 'my-name',
      })
      const actual = await validator(instance, {})
      const expected = {
        id: ['error1'],
        type: ['error2'],
      }
      assert.deepEqual(actual, expected)
    })
    it('should take the error of the one of two functions', async () => {
      const properties = {
        id: sinon.stub().returns(undefined),
        type: sinon.stub().returns(['error2']),
      }
      const validator = createModelValidator(properties)
      const testModel3 = Model('Model', { properties: {} })
      const instance = testModel3.create({
        id: 'test-id',
        type: 'my-name',
      })
      const actual = await validator(instance, {})
      const expected = {
        type: ['error2'],
      }
      assert.deepEqual(actual, expected)
    })
  })
  describe('#createPropertyValidator()', () => {
    it('should accept an undefined configuration', async () => {
      // @ts-ignore
      const validator = createPropertyValidator(() => null, undefined)
      const actual = await validator(EMPTY_MODEL_INSTANCE, {})
      const expected: readonly string[] = []
      assert.deepEqual(actual, expected)
    })

    it('should accept unhandled configurations without exception', async () => {
      const validator = createPropertyValidator(() => null, {
        // @ts-ignore
        notarealarg: false,
      })
      const actual = await validator(EMPTY_MODEL_INSTANCE, {})
      const expected: readonly string[] = []
      assert.deepEqual(actual, expected)
    })
    it('should not include isRequired if required=false, returning []', async () => {
      const validator = createPropertyValidator(() => null, { required: false })
      // @ts-ignore
      const actual = await validator(null, {})
      const expected: readonly string[] = []
      assert.deepEqual(actual, expected)
    })
    it('should return [] if no configs are provided', async () => {
      const validator = createPropertyValidator(() => null, {})
      // @ts-ignore
      const actual = await validator(null, {})
      const expected: readonly string[] = []
      assert.deepEqual(actual, expected)
    })
    it('should use isRequired if required=false, returning one error', async () => {
      const validator = createPropertyValidator(() => null, { required: true })
      // @ts-ignore
      const actual = await validator(null, {})
      const expected = 1
      assert.equal(actual.length, expected)
    })
    it('should use validators.isRequired returning one error', async () => {
      const validator = createPropertyValidator(() => null, {
        validators: [isRequired],
      })
      // @ts-ignore
      const actual = await validator(null, {})
      const expected = 1
      assert.equal(actual.length, expected)
    })
  })
  describe('#isArray()', () => {
    it('should return an error for null', () => {
      const actual = isArray(null, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return an error for undefined', () => {
      const actual = isArray(undefined, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return an error for 1', () => {
      const actual = isArray(1, EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return an error for "1"', () => {
      const actual = isArray('1', EMPTY_MODEL_INSTANCE, {})
      assert.isOk(actual)
    })
    it('should return undefined for [1,2,3]', () => {
      const actual = isArray([1, 2, 3], EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
    it('should return undefined for []', () => {
      const actual = isArray([], EMPTY_MODEL_INSTANCE, {})
      assert.isUndefined(actual)
    })
  })
  describe('#arrayType()', () => {
    describe('#(object)()', () => {
      it('should return an error for null, even though its an object, its not an array', () => {
        const actual = arrayType('object')(null, EMPTY_MODEL_INSTANCE, {})
        assert.isOk(actual)
      })
      it('should return an error for 1', () => {
        const actual = arrayType('object')(1, EMPTY_MODEL_INSTANCE, {})
        assert.isOk(actual)
      })
      it('should return undefined for [{}]', () => {
        const actual = arrayType('object')([{}], EMPTY_MODEL_INSTANCE, {})
        assert.isUndefined(actual)
      })
    })
    describe('#(integer)()', () => {
      it('should return an error for null', () => {
        const actual = arrayType(TYPE_PRIMATIVES.integer)(
          null,
          EMPTY_MODEL_INSTANCE,
          {}
        )
        assert.isOk(actual)
      })
      it('should return an error for undefined', () => {
        const actual = arrayType(TYPE_PRIMATIVES.integer)(
          undefined,
          EMPTY_MODEL_INSTANCE,
          {}
        )
        assert.isOk(actual)
      })
      it('should return an error for 1', () => {
        const actual = arrayType(TYPE_PRIMATIVES.integer)(
          1,
          EMPTY_MODEL_INSTANCE,
          {}
        )
        assert.isOk(actual)
      })
      it('should return an error for "1"', () => {
        const actual = arrayType(TYPE_PRIMATIVES.integer)(
          '1',
          EMPTY_MODEL_INSTANCE,
          {}
        )
        assert.isOk(actual)
      })
      it('should return undefined for [1,2,3]', () => {
        const actual = arrayType(TYPE_PRIMATIVES.integer)(
          [1, 2, 3],
          EMPTY_MODEL_INSTANCE,
          {}
        )
        assert.isUndefined(actual)
      })
      it('should return an error for [1,"2",3]', () => {
        const actual = arrayType(TYPE_PRIMATIVES.integer)(
          [1, '2', 3],
          EMPTY_MODEL_INSTANCE,
          {}
        )
        assert.isOk(actual)
      })
    })
  })
})
