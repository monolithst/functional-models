import * as chai from 'chai'
import { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
import sinon from 'sinon'
import { Model } from '../../src/models'
import { TextProperty, PrimaryKeyUuidProperty } from '../../src/properties'
import {
  isValid,
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
  emptyValidator,
  createModelValidator,
  createPropertyValidator,
  referenceTypeMatch,
  multiValidator,
  isObject,
  objectValidator,
  optionalValidator,
  isValidUuid,
} from '../../src/validation'
import { ModelValidatorComponent, PrimitiveValueType } from '../../src/types'

const TestModel1 = Model({
  pluralName: 'TestModel1',
  namespace: 'functional-models',
  properties: {
    id: PrimaryKeyUuidProperty(),
  },
})

const TestModel2 = Model({
  pluralName: 'TestModel2',
  namespace: 'functional-models',
  properties: {
    id: PrimaryKeyUuidProperty(),
  },
})

const createTestModel3 = (
  modelValidators: ModelValidatorComponent<{
    id: string
    name: string
  }>[]
) =>
  Model<{ id: string; name: string }>({
    pluralName: 'TestModel3',
    namespace: 'functional-models',
    properties: {
      id: PrimaryKeyUuidProperty(),
      name: TextProperty(),
    },
    modelValidators,
  })

type EMPTY_MODEL_TYPE = {}
const EMPTY_MODEL = Model<EMPTY_MODEL_TYPE>({
  pluralName: 'EmptyModel',
  namespace: 'functional-models',
  properties: {
    id: PrimaryKeyUuidProperty(),
  },
})
const EMPTY_MODEL_INSTANCE = EMPTY_MODEL.create({})

describe('/src/validation.ts', () => {
  describe('#isValidUuid()', () => {
    it('should return no error with a valid uuid', () => {
      const input = 'f66effdb-a3f0-45d7-8dbd-06a0bcabff7f'
      const actual = isValidUuid(input)
      assert.isUndefined(actual)
    })
    it('should return no error with the "NULL" uuid', () => {
      const input = '00000000-0000-0000-0000-000000000000'
      const actual = isValidUuid(input)
      assert.isUndefined(actual)
    })
    it('should return error if the uuid is a number', () => {
      const input = 123508123715091234
      const actual = isValidUuid(input)
      const expected = 'Must be a string'
      assert.deepEqual(actual, expected)
    })
    it('should return error if the uuid is missing one digit', () => {
      const input = 'f66effdb-a3f0-45d7-8dbd-06a0bcabff7'
      const actual = isValidUuid(input)
      const expected = 'Invalid UUID format'
      assert.deepEqual(actual, expected)
    })
    it('should return error if value is a string', () => {
      const input = 'random-input-here'
      const actual = isValidUuid(input)
      const expected = 'Invalid UUID format'
      assert.deepEqual(actual, expected)
    })
    it('should return error if the value is formatted like a uuid but isnt 0-9a-f', () => {
      const input = 'abcdefgh-ijkl-mnoP-QRST-UTVWXZabcdef'
      const actual = isValidUuid(input)
      const expected = 'Invalid UUID format'
      assert.deepEqual(actual, expected)
    })
  })
  describe('#optionalValidator()', () => {
    it('should return undefined if object is undefined', () => {
      const instance = optionalValidator((v: any) =>
        v === 'pass' ? undefined : 'fail'
      )
      const actual = instance(undefined)
      assert.isUndefined(actual)
    })
    it('should return undefined if object is null', () => {
      const instance = optionalValidator((v: any) =>
        v === 'pass' ? undefined : 'fail'
      )
      const actual = instance(null)
      assert.isUndefined(actual)
    })
    it('should return undefined if validator returns nothing', () => {
      const instance = optionalValidator((v: any) =>
        v === 'pass' ? undefined : 'fail'
      )
      const actual = instance('pass')
      assert.isUndefined(actual)
    })
    it('should return error if validator fails', () => {
      const instance = optionalValidator((v: any) =>
        v === 'pass' ? undefined : 'fail'
      )
      const actual = instance('not pass')
      const expected = 'fail'
      assert.equal(actual, expected)
    })
  })
  describe('#objectValidator()', () => {
    it('should return multiple errors if different properties error', () => {
      const keyToValidators = {
        myKey: [(obj: object) => undefined, (obj: object) => 'this-error'],
        myKey2: (obj: object) => 'my-error',
      }
      const obj = {
        myKey: 'my-value',
        myKey2: 'my-value-2',
      }
      const actual = objectValidator({ keyToValidators })(obj)
      const expected = 'myKey: this-error, myKey2: my-error'
      assert.equal(actual, expected)
    })
    it('should return an error in a multi validator situation', () => {
      const keyToValidators = {
        myKey: [(obj: object) => undefined, (obj: object) => 'this-error'],
        myKey2: (obj: object) => undefined,
      }
      const obj = {
        myKey: 'my-value',
        myKey2: 'my-value-2',
      }
      const actual = objectValidator({ required: true, keyToValidators })(obj)
      const expected = 'myKey: this-error'
      assert.equal(actual, expected)
    })
    it('should return an error because object is required and is undefined', () => {
      const keyToValidators = {
        myKey: (obj: object) => undefined,
        myKey2: (obj: object) => 'my-error',
      }
      const actual = objectValidator({ required: true, keyToValidators })(
        // @ts-ignore
        undefined
      )
      const expected = 'Must include a value'
      assert.equal(actual, expected)
    })
    it('should return an error if a property fails validation', () => {
      const keyToValidators = {
        myKey: (obj: object) => undefined,
        myKey2: (obj: object) => 'my-error',
      }
      const obj = {
        myKey: 'my-value',
        myKey2: 'my-value-2',
      }
      const actual = objectValidator({ keyToValidators })(obj)
      const expected = 'myKey2: my-error'
      assert.equal(actual, expected)
    })
    it('should return an error if actually an array', () => {
      const keyToValidators = {
        myKey: (obj: object) => undefined,
        myKey2: (obj: object) => 'my-error',
      }
      // @ts-ignore
      const actual = objectValidator({ keyToValidators })([])
      const expected = 'Must be an object, but got an array'
      assert.equal(actual, expected)
    })
    it('should return undefined if all validation passes', () => {
      const keyToValidators = {
        myKey: (obj: object) => undefined,
        myKey2: (obj: object) => undefined,
      }
      const obj = {
        myKey: 'my-value',
        myKey2: 'my-value-2',
        myKey3: 'not-actually-checked',
      }
      const actual = objectValidator({ keyToValidators })(obj)
      assert.isUndefined(actual)
    })
    it('should return undefined if obj is undefined but not required', () => {
      const keyToValidators = {
        myKey: (obj: object) => 'would-error',
        myKey2: (obj: object) => 'would-error-2',
      }
      //@ts-ignore
      const actual = objectValidator({ keyToValidators })(undefined)
      assert.isUndefined(actual)
    })
  })
  describe('#isObject()', () => {
    it('should return not an object error if its not an object', () => {
      // @ts-ignore
      const actual = isObject(5)
      const expected = 'Must be a object'
      assert.equal(actual, expected)
    })
    it('should return undefined if its an object', () => {
      // @ts-ignore
      const actual = isObject({})
      assert.isUndefined(actual)
    })
    it('should return array error message because the value is an array', () => {
      // @ts-ignore
      const actual = isObject([])
      const expected = 'Must be an object, but got an array'
      assert.equal(actual, expected)
    })
  })
  describe('#multiValidator()', () => {
    it('should fail isString check', () => {
      const validators = [isRequired, isString, minTextLength(5)]
      // @ts-ignore
      const actual = multiValidator(validators)(5)
      const expected = 'Must be a string'
      assert.equal(actual, expected)
    })
    it('should fail minTextLength check', () => {
      const validators = [isRequired, isString, minTextLength(5)]
      const actual = multiValidator(validators)('text')
      const expected = 'The minimum length is 5'
      assert.equal(actual, expected)
    })
    it('should return undefined when all checks pass', () => {
      const validators = [isRequired, isString, minTextLength(5)]
      const actual = multiValidator(validators)('text-is-long')
      assert.isUndefined(actual)
    })
  })
  describe('#isDate()', () => {
    it('should return an error if value is null', () => {
      // @ts-ignore
      const actual = isDate(null)
      assert.isOk(actual)
    })
    it('should return an error if value is undefined', () => {
      // @ts-ignore
      const actual = isDate(undefined)
      assert.isOk(actual)
    })
    it('should return an error object does not have toISOString', () => {
      // @ts-ignore
      const actual = isDate({})
      assert.isOk(actual)
    })
    it('should return undefined if a date', () => {
      const actual = isDate(new Date())
      assert.isUndefined(actual)
    })
  })
  describe('#isNumber()', () => {
    it('should return an error when empty is passed', () => {
      // @ts-ignore
      const actual = isNumber(null)
      assert.isOk(actual)
    })
    it('should return an error when "asdf" is passed', () => {
      // @ts-ignore
      const actual = isNumber('asdf')
      assert.isOk(actual)
    })
    it('should return undefined when 1 is passed', () => {
      const actual = isNumber(1)
      assert.isUndefined(actual)
    })
    it('should return error when "1" is passed', () => {
      // @ts-ignore
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
      // @ts-ignore
      const actual = isString(1)
      assert.isOk(actual)
    })
  })
  describe('#isRequired()', () => {
    it('should return undefined when 1 is passed', () => {
      const actual = isRequired(1)
      assert.isUndefined(actual)
    })
    it('should return undefined when a date is passed', () => {
      const actual = isRequired(new Date())
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
      // @ts-ignore
      const actual = isBoolean('true')
      assert.isOk(actual)
    })
    it('should return an error when "false" is passed', () => {
      // @ts-ignore
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
      // @ts-ignore
      const actual = maxNumber(5)('hello world', EMPTY_MODEL_INSTANCE, {})
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
      // @ts-ignore
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
      // @ts-ignore
      const actual = choices(['1', '2', '3'])('4')
      assert.isOk(actual)
    })
    it('should return undefined if choices are [1,2,3] and value is 1', () => {
      const actual = choices(['1', '2', '3'])('1')
      assert.isUndefined(actual)
    })
  })
  describe('#minTextLength()', () => {
    it('should return error if min=5 and value=5', () => {
      // @ts-ignore
      const actual = minTextLength(5)(5)
      assert.isOk(actual)
    })
    it('should return error if min=5 and value=5', () => {
      const actual = minTextLength(5)('5')
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
    it('should return error if length=5 and value=5', () => {
      // @ts-ignore
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
      const actual = (
        await aggregateValidator<EMPTY_MODEL_TYPE>(value, validators)(
          EMPTY_MODEL_INSTANCE,
          {}
        )
      ).length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return one error when one validator is passed, and the value fails', async () => {
      const validators = minTextLength(10)
      const value = 'asdf'
      const actual = (
        await aggregateValidator<EMPTY_MODEL_TYPE>(value, validators)(
          EMPTY_MODEL_INSTANCE,
          {}
        )
      ).length
      const expected = 1
      assert.equal(actual, expected)
    })
  })
  describe('#emptyValidator()', () => {
    it('should return undefined with a value of 1', () => {
      // @ts-ignore
      const actual = emptyValidator(1, EMPTY_MODEL_INSTANCE, {}, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of "1"', () => {
      // @ts-ignore
      const actual = emptyValidator('1', EMPTY_MODEL_INSTANCE, {}, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of true', () => {
      // @ts-ignore
      const actual = emptyValidator(true, EMPTY_MODEL_INSTANCE, {}, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of false', () => {
      // @ts-ignore
      const actual = emptyValidator(false, EMPTY_MODEL_INSTANCE, {}, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return undefined with a value of undefined', () => {
      // @ts-ignore
      const actual = emptyValidator(undefined, EMPTY_MODEL_INSTANCE, {}, {})
      const expected = undefined
      assert.equal(actual, expected)
    })
  })
  describe('#isInteger()', () => {
    it('should return an error with a value of "1"', () => {
      // @ts-ignore
      const actual = isInteger('1')
      assert.isOk(actual)
    })
    it('should return undefined with a value of 1', () => {
      const actual = isInteger(1)
      assert.isUndefined(actual)
    })
  })
  describe('#isValid()', () => {
    it('should return false if there is a model error', () => {
      const actual = isValid({ overall: ['a model error'] })
      assert.isFalse(actual)
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
      const instance = testModel3.create({
        id: 'test',
        name: 'my-name',
      })
      const validator = createModelValidator<{ id: string; name: string }>(
        properties,
        [modelValidator]
      )
      await validator(instance, {
        id: 'test-id',
        name: 'my-name',
      })
      sinon.assert.calledOnce(modelValidator)
    })
    it('should pass the instance into the validator as the first argument', async () => {
      const modelValidator = sinon.stub().returns(undefined)
      const testModel3 = createTestModel3([modelValidator])
      const properties = {
        id: sinon.stub().returns(undefined),
        name: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator<{ id: string; name: string }>(
        properties,
        [modelValidator]
      )
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
      const validator = createModelValidator<{ id: string; name: string }>(
        properties,
        [modelValidator]
      )
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
      const validator = createModelValidator<{ id: string; name: string }>(
        properties,
        [modelValidator]
      )
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      const actual = await validator(instance, {})
      const expected = {
        overall: ['my-validation-error'],
      }
      // @ts-ignore
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
      const validator = createModelValidator<{ id: string; name: string }>(
        properties,
        [modelValidator1, modelValidator2]
      )
      const instance = testModel3.create({
        id: 'test-id',
        name: 'my-name',
      })
      const actual = await validator(instance, {})
      assert.isUndefined(actual)
    })
    it('should use both functions.validate for two objects', async () => {
      const properties = {
        id: sinon.stub().returns(undefined),
        type: sinon.stub().returns(undefined),
      }
      const validator = createModelValidator<{ id: string; name: string }>(
        properties
      )
      const testModel3 = Model<{ id: string; name: string }>({
        pluralName: 'Model',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          name: TextProperty(),
        },
      })
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
      const validator = createModelValidator<{ id: string; name: string }>(
        properties
      )
      const testModel3 = Model<{ id: string; name: string }>({
        pluralName: 'Model',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          name: TextProperty(),
        },
      })
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
      const validator = createModelValidator<{ id: string; type: string }>(
        properties
      )
      const testModel3 = Model<{ id: string; type: string }>({
        pluralName: 'Model',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          type: TextProperty(),
        },
      })
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
      const validator = createModelValidator<{ id: string; type: string }>(
        properties
      )
      const testModel3 = Model<{ id: string; type: string }>({
        pluralName: 'Model',
        namespace: 'functional-models',
        properties: {
          id: PrimaryKeyUuidProperty(),
          type: TextProperty(),
        },
      })
      const instance = testModel3.create({
        id: 'test-id',
        type: 'my-name',
      })
      const actual = await validator(instance, {})
      const expected = {
        type: ['error2'],
      }
      assert.deepNestedInclude(actual, expected)
    })
  })
  describe('#referenceTypeMatch()', () => {
    it('should return undefined if a number is passed as a value', () => {
      // @ts-ignore
      const actual = referenceTypeMatch(TestModel1)(123)
      assert.isUndefined(actual)
    })
    it('should return undefined if undefined is passed as a value', () => {
      const myModel = TestModel1.create({})
      const actual = referenceTypeMatch(TestModel1)(
        // @ts-ignore
        undefined,
        EMPTY_MODEL_INSTANCE,
        {},
        {}
      )
      assert.isUndefined(actual)
    })
    it('should return undefined if null is passed as a value', () => {
      const myModel = TestModel1.create({})
      const actual = referenceTypeMatch(TestModel1)(
        // @ts-ignore
        null,
        EMPTY_MODEL_INSTANCE,
        {},
        {}
      )
      assert.isUndefined(actual)
    })
    it('should allow a function for a model', async () => {
      const myModel = EMPTY_MODEL.create({})
      const actual = referenceTypeMatch<EMPTY_MODEL_TYPE>(() => EMPTY_MODEL)(
        myModel,
        myModel,
        await myModel.toObj(),
        {}
      )
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should validate when the correct object matches the model', async () => {
      const myModel = EMPTY_MODEL.create({})
      const actual = referenceTypeMatch<EMPTY_MODEL_TYPE>(EMPTY_MODEL)(
        myModel,
        myModel,
        await myModel.toObj(),
        {}
      )
      const expected = undefined
      assert.equal(actual, expected)
    })
    it('should return an error when the input does not match the model', () => {
      const myModel = EMPTY_MODEL.create({})
      const actual = referenceTypeMatch(TestModel1)(
        // @ts-ignore
        myModel,
        myModel,
        {},
        {}
      )
      assert.isOk(actual)
    })
  })
  describe('#createPropertyValidator()', () => {
    it('should accept an undefined configuration', async () => {
      // @ts-ignore
      const validator = createPropertyValidator<{}, EMPTY_MODEL_TYPE>(
        () => [],
        undefined
      )
      const actual = await validator(EMPTY_MODEL_INSTANCE, {})
      const expected: readonly string[] = []
      assert.deepEqual(actual, expected)
    })

    it('should accept unhandled configurations without exception', async () => {
      const validator = createPropertyValidator<null, EMPTY_MODEL_TYPE>(
        () => null,
        {
          // @ts-ignore
          notarealarg: false,
        }
      )
      // @ts-ignore
      const actual = await validator(EMPTY_MODEL_INSTANCE, {}, {})
      const expected: readonly string[] = []
      assert.deepEqual(actual, expected)
    })
    it('should not include isRequired if required=false, returning undefined', async () => {
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
      // @ts-ignore
      const actual = isArray(null)
      assert.isOk(actual)
    })
    it('should return an error for undefined', () => {
      // @ts-ignore
      const actual = isArray(undefined)
      assert.isOk(actual)
    })
    it('should return an error for 1', () => {
      // @ts-ignore
      const actual = isArray(1)
      assert.isOk(actual)
    })
    it('should return an error for "1"', () => {
      // @ts-ignore
      const actual = isArray('1')
      assert.isOk(actual)
    })
    it('should return undefined for [1,2,3]', () => {
      const actual = isArray([1, 2, 3])
      assert.isUndefined(actual)
    })
    it('should return undefined for []', () => {
      const actual = isArray([])
      assert.isUndefined(actual)
    })
  })
  describe('#arrayType()', () => {
    describe('#(object)()', () => {
      it('should return an error for null, even though its an object, its not an array', () => {
        // @ts-ignore
        const actual = arrayType('object')(null)
        assert.isOk(actual)
      })
      it('should return an error for 1', () => {
        // @ts-ignore
        const actual = arrayType('object')(1)
        assert.isOk(actual)
      })
      it('should return undefined for [{}]', () => {
        // @ts-ignore
        const actual = arrayType('object')([{}])
        assert.isUndefined(actual)
      })
    })
    describe('#(integer)()', () => {
      it('should return an error for null', () => {
        const actual = arrayType(PrimitiveValueType.integer)(
          // @ts-ignore
          null
        )
        assert.isOk(actual)
      })
      it('should return an error for undefined', () => {
        const actual = arrayType(PrimitiveValueType.integer)(
          // @ts-ignore
          undefined
        )
        assert.isOk(actual)
      })
      it('should return an error for 1', () => {
        const actual = arrayType(PrimitiveValueType.integer)(
          // @ts-ignore
          1
        )
        assert.isOk(actual)
      })
      it('should return an error for "1"', () => {
        const actual = arrayType(PrimitiveValueType.integer)(
          // @ts-ignore
          '1'
        )
        assert.isOk(actual)
      })
      it('should return undefined for [1,2,3]', () => {
        const actual = arrayType<number>(PrimitiveValueType.integer)([1, 2, 3])
        assert.isUndefined(actual)
      })
      it('should return an error for [1,"2",3]', () => {
        const actual = arrayType<number>(PrimitiveValueType.integer)(
          // @ts-ignore
          [1, '2', 3]
        )
        assert.isOk(actual)
      })
    })
  })
})
