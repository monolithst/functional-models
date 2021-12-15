"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importDefault(require("chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
chai_1.default.use(chai_as_promised_1.default);
const sinon_1 = __importDefault(require("sinon"));
const models_1 = require("../../src/models");
const properties_1 = require("../../src/properties");
const validation_1 = require("../../src/validation");
const assert = chai_1.default.assert;
const TestModel1 = (0, models_1.BaseModel)('TestModel1', {
    properties: {},
});
const TestModel2 = (0, models_1.BaseModel)('TestModel2', {
    properties: {},
});
const createTestModel3 = (modelValidators) => (0, models_1.BaseModel)('TestModel3', {
    properties: {
        name: (0, properties_1.TextProperty)(),
    },
    modelValidators,
});
const EMPTY_MODEL = (0, models_1.BaseModel)('EmptyModel', {
    properties: {},
});
const EMPTY_MODEL_INSTANCE = EMPTY_MODEL.create({});
describe('/src/validation.ts', () => {
    describe('#isDate()', () => {
        it('should return an error if value is null', () => {
            // @ts-ignore
            const actual = (0, validation_1.isDate)(null, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error if value is undefined', () => {
            // @ts-ignore
            const actual = (0, validation_1.isDate)(undefined, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error object does not have toISOString', () => {
            // @ts-ignore
            const actual = (0, validation_1.isDate)({}, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined if a date', () => {
            const actual = (0, validation_1.isDate)(new Date(), EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#referenceTypeMatch()', () => {
        it('should return an error if undefined is passed as a value', () => {
            const myModel = TestModel1.create({});
            const actual = (0, validation_1.referenceTypeMatch)(TestModel1)(
            // @ts-ignore
            undefined, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error if null is passed as a value', () => {
            const myModel = TestModel1.create({});
            const actual = (0, validation_1.referenceTypeMatch)(TestModel1)(
            // @ts-ignore
            null, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should allow a function for a model', () => __awaiter(void 0, void 0, void 0, function* () {
            const myModel = EMPTY_MODEL.create({});
            const actual = (0, validation_1.referenceTypeMatch)(() => EMPTY_MODEL)(myModel, myModel, yield myModel.toObj());
            const expected = undefined;
            assert.equal(actual, expected);
        }));
        it('should validate when the correct object matches the model', () => __awaiter(void 0, void 0, void 0, function* () {
            const myModel = EMPTY_MODEL.create({});
            const actual = (0, validation_1.referenceTypeMatch)(EMPTY_MODEL)(myModel, myModel, yield myModel.toObj());
            const expected = undefined;
            assert.equal(actual, expected);
        }));
        it('should return an error when the input does not match the model', () => {
            const myModel = EMPTY_MODEL.create({});
            const actual = (0, validation_1.referenceTypeMatch)(TestModel1)(
            // @ts-ignore
            myModel, myModel, {});
            assert.isOk(actual);
        });
    });
    describe('#isNumber()', () => {
        it('should return an error when empty is passed', () => {
            const actual = (0, validation_1.isNumber)(null, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error when "asdf" is passed', () => {
            const actual = (0, validation_1.isNumber)('asdf', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined when 1 is passed', () => {
            const actual = (0, validation_1.isNumber)(1, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return error when "1" is passed', () => {
            const actual = (0, validation_1.isNumber)('1', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
    });
    describe('#isString()', () => {
        it('should return undefined when "1" is passed', () => {
            const actual = (0, validation_1.isString)('1', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return error when 1 is passed', () => {
            const actual = (0, validation_1.isString)(1, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
    });
    describe('#isRequired()', () => {
        it('should return undefined when 1 is passed', () => {
            const actual = (0, validation_1.isRequired)(1, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined when a date is passed', () => {
            const actual = (0, validation_1.isRequired)(new Date(), EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined when 0 is passed', () => {
            const actual = (0, validation_1.isRequired)(0, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined when "something" is passed', () => {
            const actual = (0, validation_1.isRequired)('something', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return error when null is passed', () => {
            const actual = (0, validation_1.isRequired)(null, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return error when undefined is passed', () => {
            const actual = (0, validation_1.isRequired)(undefined, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined when false is passed', () => {
            const actual = (0, validation_1.isRequired)(false, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined when true is passed', () => {
            const actual = (0, validation_1.isRequired)(true, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#isBoolean()', () => {
        it('should return error when "true" is passed"', () => {
            const actual = (0, validation_1.isBoolean)('true', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error when "false" is passed', () => {
            const actual = (0, validation_1.isBoolean)('false', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined when true is passed"', () => {
            const actual = (0, validation_1.isBoolean)(true, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined when false is passed', () => {
            const actual = (0, validation_1.isBoolean)(false, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#maxNumber()', () => {
        it('should return error if max=5 and value="hello world"', () => {
            // @ts-ignore
            const actual = (0, validation_1.maxNumber)(5)('hello world', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return error if max=5 and value=6', () => {
            const actual = (0, validation_1.maxNumber)(5)(6, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined if max=5 and value=5', () => {
            const actual = (0, validation_1.maxNumber)(5)(5, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined if max=5 and value=4', () => {
            const actual = (0, validation_1.maxNumber)(5)(4, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#minNumber()', () => {
        it('should return error if min=5 and value="hello world"', () => {
            // @ts-ignore
            const actual = (0, validation_1.minNumber)(5)('hello world', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return error if min=5 and value=4', () => {
            const actual = (0, validation_1.minNumber)(5)(4, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined if min=5 and value=4', () => {
            const actual = (0, validation_1.minNumber)(5)(5, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined if min=5 and value=6', () => {
            const actual = (0, validation_1.minNumber)(5)(6, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#choices()', () => {
        it('should return an error if choices are [1,2,3] and value is 4', () => {
            const actual = (0, validation_1.choices)(['1', '2', '3'])('4', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined if choices are [1,2,3] and value is 1', () => {
            const actual = (0, validation_1.choices)(['1', '2', '3'])('1', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#minTextLength()', () => {
        it('should return error if min=5 and value=5', () => {
            // @ts-ignore
            const actual = (0, validation_1.minTextLength)(5)(5, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return error if min=5 and value=5', () => {
            const actual = (0, validation_1.minTextLength)(5)('5', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return error if length=5 and value="asdf"', () => {
            const actual = (0, validation_1.minTextLength)(5)('asdf', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined if length=5 and value="hello"', () => {
            const actual = (0, validation_1.minTextLength)(5)('hello', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined if length=5 and value="hello world"', () => {
            const actual = (0, validation_1.minTextLength)(5)('hello world', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#maxTextLength()', () => {
        it('should return error if length=5 and value=5', () => {
            // @ts-ignore
            const actual = (0, validation_1.maxTextLength)(5)(5, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return error if length=5 and value="hello world"', () => {
            const actual = (0, validation_1.maxTextLength)(5)('hello world', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined if length=5 and value="hello"', () => {
            const actual = (0, validation_1.maxTextLength)(5)('hello', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined if length=5 and value="asdf"', () => {
            const actual = (0, validation_1.maxTextLength)(5)('asdf', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#meetsRegex()', () => {
        it('should return an error with regex=/asdf/ flags="g" and value="hello world"', () => {
            const actual = (0, validation_1.meetsRegex)(/asdf/, 'g')('hello world', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined with regex=/asdf/ flags="g" and value="hello asdf world"', () => {
            const actual = (0, validation_1.meetsRegex)(/asdf/, 'g')('asdf', EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#aggregateValidator()', () => {
        it('should return two errors when two validators are passed, and the value fails both', () => __awaiter(void 0, void 0, void 0, function* () {
            const validators = [(0, validation_1.minTextLength)(10), validation_1.isNumber];
            const value = 'asdf';
            const actual = (yield (0, validation_1.aggregateValidator)(value, validators)(EMPTY_MODEL_INSTANCE, {})).length;
            const expected = 2;
            assert.equal(actual, expected);
        }));
        it('should return one error when one validator is passed, and the value fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const validators = (0, validation_1.minTextLength)(10);
            const value = 'asdf';
            const actual = (yield (0, validation_1.aggregateValidator)(value, validators)(EMPTY_MODEL_INSTANCE, {})).length;
            const expected = 1;
            assert.equal(actual, expected);
        }));
    });
    describe('#emptyValidator()', () => {
        it('should return undefined with a value of 1', () => {
            const actual = (0, validation_1.emptyValidator)(1, EMPTY_MODEL_INSTANCE, {});
            const expected = undefined;
            assert.equal(actual, expected);
        });
        it('should return undefined with a value of "1"', () => {
            const actual = (0, validation_1.emptyValidator)('1', EMPTY_MODEL_INSTANCE, {});
            const expected = undefined;
            assert.equal(actual, expected);
        });
        it('should return undefined with a value of true', () => {
            const actual = (0, validation_1.emptyValidator)(true, EMPTY_MODEL_INSTANCE, {});
            const expected = undefined;
            assert.equal(actual, expected);
        });
        it('should return undefined with a value of false', () => {
            const actual = (0, validation_1.emptyValidator)(false, EMPTY_MODEL_INSTANCE, {});
            const expected = undefined;
            assert.equal(actual, expected);
        });
        it('should return undefined with a value of undefined', () => {
            const actual = (0, validation_1.emptyValidator)(undefined, EMPTY_MODEL_INSTANCE, {});
            const expected = undefined;
            assert.equal(actual, expected);
        });
    });
    describe('#isInteger()', () => {
        it('should return an error with a value of "1"', () => {
            const actual = (0, validation_1.isInteger)('1', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined with a value of 1', () => {
            const actual = (0, validation_1.isInteger)(1, EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#createModelValidator()', () => {
        it('should throw an exception if instance is null', () => {
            const modelValidator = sinon_1.default.stub().returns(undefined);
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                name: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties, [modelValidator]);
            // @ts-ignore
            assert.isRejected(validator(undefined, {}));
        });
        it('should call the model validator passed in', () => __awaiter(void 0, void 0, void 0, function* () {
            const modelValidator = sinon_1.default.stub().returns(undefined);
            const testModel3 = createTestModel3([modelValidator]);
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                name: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties, [modelValidator]);
            yield validator(testModel3.create({
                id: 'test-id',
                name: 'my-name',
            }), {
                id: 'test-id',
                name: 'my-name',
            });
            sinon_1.default.assert.calledOnce(modelValidator);
        }));
        it('should pass the instance into the validator as the first argument', () => __awaiter(void 0, void 0, void 0, function* () {
            const modelValidator = sinon_1.default.stub().returns(undefined);
            const testModel3 = createTestModel3([modelValidator]);
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                name: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties, [modelValidator]);
            const instance = testModel3.create({
                id: 'test-id',
                name: 'my-name',
            });
            yield validator(instance, {});
            const actual = modelValidator.getCall(0).args[0];
            const expected = instance;
            assert.deepEqual(actual, expected);
        }));
        it('should pass the instance data into the validator as the second argument', () => __awaiter(void 0, void 0, void 0, function* () {
            const modelValidator = sinon_1.default.stub().returns(undefined);
            const testModel3 = createTestModel3([modelValidator]);
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                name: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties, [modelValidator]);
            const instance = testModel3.create({
                id: 'test-id',
                name: 'my-name',
            });
            const expected = yield instance.toObj();
            yield validator(instance, {});
            const actual = modelValidator.getCall(0).args[1];
            assert.deepEqual(actual, expected);
        }));
        it('should return a overall: ["my-validation-error"] when the model validator returns "my-validation-error"', () => __awaiter(void 0, void 0, void 0, function* () {
            const modelValidator = sinon_1.default.stub().returns('my-validation-error');
            const testModel3 = createTestModel3([modelValidator]);
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                name: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties, [modelValidator]);
            const instance = testModel3.create({
                id: 'test-id',
                name: 'my-name',
            });
            const actual = yield validator(instance, {});
            const expected = {
                overall: ['my-validation-error'],
            };
            assert.deepEqual(actual, expected);
        }));
        it('should return no errors when two model validators return undefined', () => __awaiter(void 0, void 0, void 0, function* () {
            const modelValidator1 = sinon_1.default.stub().resolves(undefined);
            const modelValidator2 = sinon_1.default.stub().resolves(undefined);
            const testModel3 = createTestModel3([modelValidator1, modelValidator2]);
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                name: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties, [
                modelValidator1,
                modelValidator2,
            ]);
            const instance = testModel3.create({
                id: 'test-id',
                name: 'my-name',
            });
            const actual = yield validator(instance, {});
            const expected = {};
            assert.deepEqual(actual, expected);
        }));
        it('should use both functions.validate for two objects', () => __awaiter(void 0, void 0, void 0, function* () {
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                type: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties);
            const testModel3 = (0, models_1.BaseModel)('Model', { properties: {} });
            const instance = testModel3.create({
                id: 'test-id',
                name: 'my-name',
            });
            yield validator(instance, {});
            sinon_1.default.assert.calledOnce(properties.id);
            sinon_1.default.assert.calledOnce(properties.type);
        }));
        it('should run a validators.model() function', () => __awaiter(void 0, void 0, void 0, function* () {
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                type: sinon_1.default.stub().returns(undefined),
                model: sinon_1.default.stub().returns(undefined),
            };
            const validator = (0, validation_1.createModelValidator)(properties);
            const testModel3 = (0, models_1.BaseModel)('Model', { properties: {} });
            const instance = testModel3.create({
                id: 'test-id',
                name: 'my-name',
            });
            yield validator(instance, {});
            sinon_1.default.assert.called(properties.model);
        }));
        it('should combine results for both validators for two objects that error', () => __awaiter(void 0, void 0, void 0, function* () {
            const properties = {
                id: sinon_1.default.stub().returns(['error1']),
                type: sinon_1.default.stub().returns(['error2']),
            };
            const validator = (0, validation_1.createModelValidator)(properties);
            const testModel3 = (0, models_1.BaseModel)('Model', { properties: {} });
            const instance = testModel3.create({
                id: 'test-id',
                type: 'my-name',
            });
            const actual = yield validator(instance, {});
            const expected = {
                id: ['error1'],
                type: ['error2'],
            };
            assert.deepEqual(actual, expected);
        }));
        it('should take the error of the one of two functions', () => __awaiter(void 0, void 0, void 0, function* () {
            const properties = {
                id: sinon_1.default.stub().returns(undefined),
                type: sinon_1.default.stub().returns(['error2']),
            };
            const validator = (0, validation_1.createModelValidator)(properties);
            const testModel3 = (0, models_1.BaseModel)('Model', { properties: {} });
            const instance = testModel3.create({
                id: 'test-id',
                type: 'my-name',
            });
            const actual = yield validator(instance, {});
            const expected = {
                type: ['error2'],
            };
            assert.deepEqual(actual, expected);
        }));
    });
    describe('#createPropertyValidator()', () => {
        it('should accept an undefined configuration', () => __awaiter(void 0, void 0, void 0, function* () {
            // @ts-ignore
            const validator = (0, validation_1.createPropertyValidator)(() => null, undefined);
            const actual = yield validator(EMPTY_MODEL_INSTANCE, {});
            const expected = [];
            assert.deepEqual(actual, expected);
        }));
        it('should accept unhandled configurations without exception', () => __awaiter(void 0, void 0, void 0, function* () {
            const validator = (0, validation_1.createPropertyValidator)(() => null, {
                // @ts-ignore
                notarealarg: false,
            });
            const actual = yield validator(EMPTY_MODEL_INSTANCE, {});
            const expected = [];
            assert.deepEqual(actual, expected);
        }));
        it('should not include isRequired if required=false, returning []', () => __awaiter(void 0, void 0, void 0, function* () {
            const validator = (0, validation_1.createPropertyValidator)(() => null, { required: false });
            // @ts-ignore
            const actual = yield validator(null, {});
            const expected = [];
            assert.deepEqual(actual, expected);
        }));
        it('should return [] if no configs are provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const validator = (0, validation_1.createPropertyValidator)(() => null, {});
            // @ts-ignore
            const actual = yield validator(null, {});
            const expected = [];
            assert.deepEqual(actual, expected);
        }));
        it('should use isRequired if required=false, returning one error', () => __awaiter(void 0, void 0, void 0, function* () {
            const validator = (0, validation_1.createPropertyValidator)(() => null, { required: true });
            // @ts-ignore
            const actual = yield validator(null, {});
            const expected = 1;
            assert.equal(actual.length, expected);
        }));
        it('should use validators.isRequired returning one error', () => __awaiter(void 0, void 0, void 0, function* () {
            const validator = (0, validation_1.createPropertyValidator)(() => null, {
                validators: [validation_1.isRequired],
            });
            // @ts-ignore
            const actual = yield validator(null, {});
            const expected = 1;
            assert.equal(actual.length, expected);
        }));
    });
    describe('#isArray()', () => {
        it('should return an error for null', () => {
            const actual = (0, validation_1.isArray)(null, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error for undefined', () => {
            const actual = (0, validation_1.isArray)(undefined, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error for 1', () => {
            const actual = (0, validation_1.isArray)(1, EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return an error for "1"', () => {
            const actual = (0, validation_1.isArray)('1', EMPTY_MODEL_INSTANCE, {});
            assert.isOk(actual);
        });
        it('should return undefined for [1,2,3]', () => {
            const actual = (0, validation_1.isArray)([1, 2, 3], EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
        it('should return undefined for []', () => {
            const actual = (0, validation_1.isArray)([], EMPTY_MODEL_INSTANCE, {});
            assert.isUndefined(actual);
        });
    });
    describe('#arrayType()', () => {
        describe('#(object)()', () => {
            it('should return an error for null, even though its an object, its not an array', () => {
                const actual = (0, validation_1.arrayType)('object')(null, EMPTY_MODEL_INSTANCE, {});
                assert.isOk(actual);
            });
            it('should return an error for 1', () => {
                const actual = (0, validation_1.arrayType)('object')(1, EMPTY_MODEL_INSTANCE, {});
                assert.isOk(actual);
            });
            it('should return undefined for [{}]', () => {
                const actual = (0, validation_1.arrayType)('object')([{}], EMPTY_MODEL_INSTANCE, {});
                assert.isUndefined(actual);
            });
        });
        describe('#(integer)()', () => {
            it('should return an error for null', () => {
                const actual = (0, validation_1.arrayType)(validation_1.TYPE_PRIMITIVES.integer)(null, EMPTY_MODEL_INSTANCE, {});
                assert.isOk(actual);
            });
            it('should return an error for undefined', () => {
                const actual = (0, validation_1.arrayType)(validation_1.TYPE_PRIMITIVES.integer)(undefined, EMPTY_MODEL_INSTANCE, {});
                assert.isOk(actual);
            });
            it('should return an error for 1', () => {
                const actual = (0, validation_1.arrayType)(validation_1.TYPE_PRIMITIVES.integer)(1, EMPTY_MODEL_INSTANCE, {});
                assert.isOk(actual);
            });
            it('should return an error for "1"', () => {
                const actual = (0, validation_1.arrayType)(validation_1.TYPE_PRIMITIVES.integer)('1', EMPTY_MODEL_INSTANCE, {});
                assert.isOk(actual);
            });
            it('should return undefined for [1,2,3]', () => {
                const actual = (0, validation_1.arrayType)(validation_1.TYPE_PRIMITIVES.integer)([1, 2, 3], EMPTY_MODEL_INSTANCE, {});
                assert.isUndefined(actual);
            });
            it('should return an error for [1,"2",3]', () => {
                const actual = (0, validation_1.arrayType)(validation_1.TYPE_PRIMITIVES.integer)([1, '2', 3], EMPTY_MODEL_INSTANCE, {});
                assert.isOk(actual);
            });
        });
    });
});
//# sourceMappingURL=validation.test.js.map