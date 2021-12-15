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
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const properties_1 = require("../../src/properties");
const validation_1 = require("../../src/validation");
const models_1 = require("../../src/models");
const TestModel1 = (0, models_1.BaseModel)('TestModel1', {
    properties: {
        name: (0, properties_1.TextProperty)(),
    },
});
describe('/src/properties.ts', () => {
    describe('#EmailProperty()', () => {
        describe('#createGetter()', () => {
            it('should be able to create without a config', () => {
                chai_1.assert.doesNotThrow(() => {
                    (0, properties_1.EmailProperty)();
                });
            });
            it('should always have the value passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.EmailProperty)({});
                const getter = PropertyInstance.createGetter('testme@email.com');
                const actual = yield getter();
                const expected = 'testme@email.com';
                chai_1.assert.deepEqual(actual, expected);
            }));
        });
        describe('#getValidator()', () => {
            it('should return and validate successful with basic input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.EmailProperty)({});
                const getter = PropertyInstance.createGetter('testme@email.com');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator(null, {});
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#BooleanProperty()', () => {
        it('should be able to create without a config', () => {
            chai_1.assert.doesNotThrow(() => {
                (0, properties_1.BooleanProperty)();
            });
        });
        describe('#getValidator()', () => {
            it('should return and validate successful with basic input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.BooleanProperty)({});
                const getter = PropertyInstance.createGetter(true);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator(null, {});
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#ConstantValueProperty()', () => {
        describe('#createGetter()', () => {
            it('should always have the value passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.ConstantValueProperty)('constant');
                const getter = PropertyInstance.createGetter('changed');
                const actual = yield getter();
                const expected = 'constant';
                chai_1.assert.deepEqual(actual, expected);
            }));
        });
        describe('#getValidator()', () => {
            it('should return and validate successful with basic input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.ConstantValueProperty)('constant');
                const getter = PropertyInstance.createGetter('changed');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator(null, {});
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#ObjectProperty()', () => {
        describe('#createGetter()', () => {
            it('should be able to create without a config', () => {
                chai_1.assert.doesNotThrow(() => {
                    (0, properties_1.ObjectProperty)();
                });
            });
            it('should be able to get the object passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.ObjectProperty)({});
                const getter = PropertyInstance.createGetter({
                    my: 'object',
                    complex: { it: 'is' },
                });
                const actual = yield getter();
                const expected = { my: 'object', complex: { it: 'is' } };
                chai_1.assert.deepEqual(actual, expected);
            }));
        });
        describe('#getValidator()', () => {
            it('should return and validate successful with basic input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.ObjectProperty)({});
                const getter = PropertyInstance.createGetter({
                    my: 'object',
                    complex: { it: 'is' },
                });
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator(null, {});
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#NumberProperty()', () => {
        describe('#createGetter()', () => {
            it('should be able to create without a config', () => {
                chai_1.assert.doesNotThrow(() => {
                    (0, properties_1.NumberProperty)();
                });
            });
            it('should be able to create even with a null config', () => {
                chai_1.assert.doesNotThrow(() => {
                    // @ts-ignore
                    (0, properties_1.NumberProperty)(null);
                });
            });
            it('should be able to get the number passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({});
                const getter = PropertyInstance.createGetter(5);
                const actual = yield getter();
                const expected = 5;
                chai_1.assert.equal(actual, expected);
            }));
            it('should be able to get float passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({});
                const getter = PropertyInstance.createGetter(5.123);
                const actual = yield getter();
                const expected = 5.123;
                chai_1.assert.equal(actual, expected);
            }));
        });
        describe('#getValidator()', () => {
            it('should return and validate successful with basic input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({});
                const getter = PropertyInstance.createGetter(5);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator(null, {});
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return and validate successful with a basic float', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({});
                const getter = PropertyInstance.createGetter(5.123);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator(null, {});
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a non integer input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({});
                // @ts-ignore
                const getter = PropertyInstance.createGetter('string');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator(null, {});
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a value=5 and maxValue=3', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({ maxValue: 3 });
                const getter = PropertyInstance.createGetter(5);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a value=2 and minValue=3', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({ minValue: 3 });
                const getter = PropertyInstance.createGetter(2);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with no errors with a value=3 and minValue=3 and maxValue=3', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.NumberProperty)({ minValue: 3, maxValue: 3 });
                const getter = PropertyInstance.createGetter(3);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#IntegerProperty()', () => {
        it('should be able to create even with a null config', () => {
            chai_1.assert.doesNotThrow(() => {
                // @ts-ignore
                (0, properties_1.IntegerProperty)(null);
            });
        });
        describe('#createGetter()', () => {
            it('should be able to create without a config', () => {
                chai_1.assert.doesNotThrow(() => {
                    (0, properties_1.IntegerProperty)();
                });
            });
            it('should be able to get the number passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.IntegerProperty)({});
                const getter = PropertyInstance.createGetter(5);
                const actual = yield getter();
                const expected = 5;
                chai_1.assert.equal(actual, expected);
            }));
        });
        describe('#getValidator()', () => {
            it('should return and validate successful with basic input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.IntegerProperty)({});
                const getter = PropertyInstance.createGetter(5);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return errors with a basic float', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.IntegerProperty)({});
                const getter = PropertyInstance.createGetter(5.123);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a non integer input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.IntegerProperty)({});
                // @ts-ignore
                const getter = PropertyInstance.createGetter('string');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a value=5 and maxValue=3', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.IntegerProperty)({ maxValue: 3 });
                const getter = PropertyInstance.createGetter(5);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a value=2 and minValue=3', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.IntegerProperty)({ minValue: 3 });
                const getter = PropertyInstance.createGetter(2);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with no errors with a value=3 and minValue=3 and maxValue=3', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.IntegerProperty)({ minValue: 3, maxValue: 3 });
                const getter = PropertyInstance.createGetter(3);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#TextProperty()', () => {
        it('should be able to create even with a null config', () => {
            chai_1.assert.doesNotThrow(() => {
                // @ts-ignore
                (0, properties_1.TextProperty)(null);
            });
        });
        describe('#createGetter()', () => {
            it('should be able to create without a config', () => {
                chai_1.assert.doesNotThrow(() => {
                    (0, properties_1.TextProperty)();
                });
            });
            it('should be able to get the value passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.TextProperty)({});
                const getter = PropertyInstance.createGetter('basic input');
                const actual = yield getter();
                const expected = 'basic input';
                chai_1.assert.equal(actual, expected);
            }));
        });
        describe('#getValidator()', () => {
            it('should return and validate successful with basic input', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.TextProperty)({});
                const getter = PropertyInstance.createGetter('basic input');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a value=5', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.TextProperty)({});
                // @ts-ignore
                const getter = PropertyInstance.createGetter(5);
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a value="hello" and maxLength=3', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.TextProperty)({ maxLength: 3 });
                const getter = PropertyInstance.createGetter('hello');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with errors with a value="hello" and minLength=10', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.TextProperty)({ minLength: 10 });
                const getter = PropertyInstance.createGetter('hello');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
            it('should return with no errors with a value="hello" and minLength=5 and maxLength=5', () => __awaiter(void 0, void 0, void 0, function* () {
                const PropertyInstance = (0, properties_1.TextProperty)({ minLength: 5, maxLength: 5 });
                const getter = PropertyInstance.createGetter('hello');
                const validator = PropertyInstance.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 0;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#ArrayProperty()', () => {
        describe('#createGetter()', () => {
            it('should return an array passed in without issue', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)({});
                const getter = theProperty.createGetter([1, 2, 3]);
                const actual = yield getter();
                const expected = [1, 2, 3];
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return an array passed in without issue, even if no config is passed', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)();
                const getter = theProperty.createGetter([1, 2, 3]);
                const actual = yield getter();
                const expected = [1, 2, 3];
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return an empty array if defaultValue is not changed in config and null is passed', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)();
                // @ts-ignore
                const getter = theProperty.createGetter(null);
                const actual = yield getter();
                const expected = [];
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return the passed in defaultValue if set in config and null is passed', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)({ defaultValue: [1, 2, 3] });
                // @ts-ignore
                const getter = theProperty.createGetter(null);
                const actual = yield getter();
                const expected = [1, 2, 3];
                chai_1.assert.deepEqual(actual, expected);
            }));
        });
        describe('#getValidator()', () => {
            it('should validate an array passed in without issue', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)({});
                const getter = theProperty.createGetter([1, 2, 3]);
                const validator = theProperty.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = [];
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should error an array passed in when it doesnt have the right types', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)({
                    validators: [(0, validation_1.arrayType)(validation_1.TYPE_PRIMITIVES.integer)],
                });
                const getter = theProperty.createGetter([1, 'string', 3]);
                const validator = theProperty.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.deepEqual(actual.length, expected);
            }));
            it('should validate an array with [4,4,5,5,6,6] when choices are [4,5,6]', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)({ choices: [4, 5, 6] });
                const getter = theProperty.createGetter([4, 4, 5, 5, 6, 6]);
                const validator = theProperty.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = [];
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return errors when an array with [4,4,3,5,5,6,6] when choices are [4,5,6]', () => __awaiter(void 0, void 0, void 0, function* () {
                const theProperty = (0, properties_1.ArrayProperty)({ choices: [4, 5, 6] });
                const getter = theProperty.createGetter([4, 4, 3, 5, 5, 6, 6]);
                const validator = theProperty.getValidator(getter);
                // @ts-ignore
                const actual = yield validator();
                const expected = 1;
                chai_1.assert.equal(actual.length, expected);
            }));
        });
    });
    describe('#Property()', () => {
        it('should throw an exception if a type is not provided', () => {
            chai_1.assert.throws(() => {
                // @ts-ignore
                (0, properties_1.Property)(undefined, {});
            });
        });
        it('should throw an exception if a type is not provided, and config is null', () => {
            chai_1.assert.throws(() => {
                // @ts-ignore
                (0, properties_1.Property)(undefined, null);
            });
        });
        it('should throw an exception if config.valueSelector is not a function but is set', () => {
            chai_1.assert.throws(() => {
                // @ts-ignore
                (0, properties_1.Property)('MyProperty', { valueSelector: 'blah' });
            });
        });
        it('should not throw an exception if config.valueSelector is a function', () => {
            chai_1.assert.doesNotThrow(() => {
                (0, properties_1.Property)('MyProperty', { valueSelector: () => ({}) });
            });
        });
        it('should not throw an exception if config is null', () => {
            chai_1.assert.doesNotThrow(() => {
                // @ts-ignore
                (0, properties_1.Property)('MyProperty', null);
            });
        });
        describe('#getConstantValue()', () => {
            it('should provide undefined if no config', () => {
                // @ts-ignore
                const instance = (0, properties_1.Property)('MyTYpe', null);
                const actual = instance.getConstantValue();
                const expected = undefined;
                chai_1.assert.deepEqual(actual, expected);
            });
        });
        describe('#getPropertyType()', () => {
            it('should use the type that is passed in via config', () => {
                const instance = (0, properties_1.Property)('OverrideMe', { type: 'ExtendedType' });
                const actual = instance.getPropertyType();
                const expected = 'ExtendedType';
                chai_1.assert.equal(actual, expected);
            });
        });
        describe('#getConfig()', () => {
            it('should provide the config that is passed in ', () => {
                // @ts-ignore
                const instance = (0, properties_1.Property)('MyTYpe', { custom: 'value' });
                const actual = instance.getConfig();
                const expected = { custom: 'value' };
                chai_1.assert.deepEqual(actual, expected);
            });
            it('should provide {} if no config', () => {
                // @ts-ignore
                const instance = (0, properties_1.Property)('MyTYpe', null);
                const actual = instance.getConfig();
                const expected = {};
                chai_1.assert.deepEqual(actual, expected);
            });
        });
        describe('#getDefaultValue()', () => {
            it('should provide undefined if no config', () => {
                // @ts-ignore
                const instance = (0, properties_1.Property)('MyTYpe', null);
                const actual = instance.getDefaultValue();
                const expected = undefined;
                chai_1.assert.deepEqual(actual, expected);
            });
            it('should provide the defaultValue that is passed in if no value', () => {
                // @ts-ignore
                const instance = (0, properties_1.Property)('MyTYpe', { defaultValue: 'test-me' });
                const actual = instance.getDefaultValue();
                const expected = 'test-me';
                chai_1.assert.deepEqual(actual, expected);
            });
        });
        describe('#getChoices()', () => {
            it('should provide [] if no config', () => {
                // @ts-ignore
                const instance = (0, properties_1.Property)('MyTYpe', null);
                const actual = instance.getChoices();
                const expected = [];
                chai_1.assert.deepEqual(actual, expected);
            });
            it('should provide the choices that are passed in ', () => {
                // @ts-ignore
                const instance = (0, properties_1.Property)('MyTYpe', { choices: [1, 2, 3] });
                const actual = instance.getChoices();
                const expected = [1, 2, 3];
                chai_1.assert.deepEqual(actual, expected);
            });
        });
        describe('#createGetter()', () => {
            it('should return a function even if config.value is set to a value', () => {
                const instance = (0, properties_1.Property)('MyProperty', { value: 'my-value' });
                const actual = instance.createGetter('not-my-value');
                chai_1.assert.isFunction(actual);
            });
            it('should return the value passed into config.value regardless of what is passed into the createGetter', () => __awaiter(void 0, void 0, void 0, function* () {
                const instance = (0, properties_1.Property)('MyProperty', { value: 'my-value' });
                const actual = yield instance.createGetter('not-my-value')();
                const expected = 'my-value';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return the value passed into createGetter when config.value is not set', () => __awaiter(void 0, void 0, void 0, function* () {
                const instance = (0, properties_1.Property)('MyProperty');
                const actual = yield instance.createGetter('my-value')();
                const expected = 'my-value';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return the value of the function passed into createGetter when config.value is not set', () => __awaiter(void 0, void 0, void 0, function* () {
                const instance = (0, properties_1.Property)('MyProperty');
                const actual = yield instance.createGetter(() => 'my-value')();
                const expected = 'my-value';
                chai_1.assert.deepEqual(actual, expected);
            }));
        });
    });
    describe('#UniqueId()', () => {
        describe('#createGetter()', () => {
            it('should call createUuid only once even if called twice', () => __awaiter(void 0, void 0, void 0, function* () {
                const uniqueProperty = (0, properties_1.UniqueId)({});
                // @ts-ignore
                const getter = uniqueProperty.createGetter(undefined);
                const first = yield getter();
                const second = yield getter();
                chai_1.assert.deepEqual(first, second);
            }));
            it('should use the uuid passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const uniqueProperty = (0, properties_1.UniqueId)({});
                const getter = uniqueProperty.createGetter('my-uuid');
                const actual = yield getter();
                const expected = 'my-uuid';
                chai_1.assert.deepEqual(actual, expected);
            }));
        });
    });
    describe('#DateProperty()', () => {
        it('should allow creation without a config', () => __awaiter(void 0, void 0, void 0, function* () {
            const proto = (0, properties_1.DateProperty)();
            const instance = proto.createGetter(new Date());
            chai_1.assert.isOk(yield instance());
        }));
        it('should create a new date once when config.autoNow=true and called multiple times', () => __awaiter(void 0, void 0, void 0, function* () {
            const proto = (0, properties_1.DateProperty)({ autoNow: true });
            const instance = proto.createGetter(undefined);
            const first = yield instance();
            const second = yield instance();
            const third = yield instance();
            chai_1.assert.deepEqual(first, second);
            chai_1.assert.deepEqual(first, third);
        }));
        it('should use the date passed in', () => __awaiter(void 0, void 0, void 0, function* () {
            const proto = (0, properties_1.DateProperty)({ autoNow: true });
            const date = new Date();
            const instance = proto.createGetter(date);
            const actual = yield instance();
            const expected = date;
            chai_1.assert.deepEqual(actual, expected);
        }));
        it('should return null, if null config is passed and no value created.', () => __awaiter(void 0, void 0, void 0, function* () {
            // @ts-ignore
            const proto = (0, properties_1.DateProperty)(null);
            const date = null;
            const instance = proto.createGetter(date);
            const actual = yield instance();
            const expected = null;
            chai_1.assert.deepEqual(actual, expected);
        }));
    });
    describe('#ReferenceProperty()', () => {
        it('should throw an exception if a model value is not passed in', () => {
            chai_1.assert.throws(() => {
                const input = ['obj-id'];
                // @ts-ignore
                const actual = (0, properties_1.ReferenceProperty)(null, {});
            });
        });
        describe('#meta.getReferencedModel()', () => {
            it('should return the same value passed in as the model', () => __awaiter(void 0, void 0, void 0, function* () {
                const property = (0, properties_1.ReferenceProperty)(TestModel1);
                const actual = property.getReferencedModel();
                const expected = TestModel1;
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should allow a function input for model to allow delayed creation', () => __awaiter(void 0, void 0, void 0, function* () {
                const property = (0, properties_1.ReferenceProperty)(() => TestModel1);
                const actual = property.getReferencedModel();
                const expected = TestModel1;
                chai_1.assert.deepEqual(actual, expected);
            }));
        });
        describe('#createGetter()', () => {
            it('should return "obj-id" when no fetcher is used', () => __awaiter(void 0, void 0, void 0, function* () {
                const actual = yield (0, properties_1.ReferenceProperty)(TestModel1, {}).createGetter('obj-id')();
                const expected = 'obj-id';
                chai_1.assert.equal(actual, expected);
            }));
            it('should allow null as the input', () => __awaiter(void 0, void 0, void 0, function* () {
                const actual = yield (0, properties_1.ReferenceProperty)(TestModel1, {}).createGetter(null)();
                const expected = null;
                chai_1.assert.equal(actual, expected);
            }));
            it('should return "obj-id" from {}.id when no fetcher is used', () => __awaiter(void 0, void 0, void 0, function* () {
                const actual = yield (0, properties_1.ReferenceProperty)(TestModel1, {}).createGetter(
                // @ts-ignore
                { id: 'obj-id' })();
                const expected = 'obj-id';
                chai_1.assert.equal(actual, expected);
            }));
            it('should return 123 from {}.id when no fetcher is used', () => __awaiter(void 0, void 0, void 0, function* () {
                const actual = yield (0, properties_1.ReferenceProperty)(TestModel1, {}).createGetter(123)();
                const expected = 123;
                chai_1.assert.equal(actual, expected);
            }));
            it('should return name:"switch-a-roo" when switch-a-roo fetcher is used', () => __awaiter(void 0, void 0, void 0, function* () {
                const actual = (yield (0, properties_1.ReferenceProperty)(TestModel1, {
                    fetcher: () => __awaiter(void 0, void 0, void 0, function* () { return ({ id: 'obj-id', name: 'switch-a-roo' }); }),
                }).createGetter('obj-id')());
                const expected = 'switch-a-roo';
                chai_1.assert.deepEqual(actual.get.name(), expected);
            }));
            it('should return "obj-id" if no config passed', () => __awaiter(void 0, void 0, void 0, function* () {
                // @ts-ignore
                const actual = (yield (0, properties_1.ReferenceProperty)(TestModel1, null).createGetter('obj-id')());
                const expected = 'obj-id';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return null when fetcher is used, but the instance value passed in is empty', () => __awaiter(void 0, void 0, void 0, function* () {
                const actual = (yield (0, properties_1.ReferenceProperty)(TestModel1, {
                    fetcher: () => __awaiter(void 0, void 0, void 0, function* () { return ({ id: 'obj-id', name: 'switch-a-roo' }); }),
                }).createGetter(null)());
                const expected = null;
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should provide the passed in model and the instance values when switch-a-roo fetcher is used', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = 'obj-id';
                const fetcher = sinon_1.default.stub().callsFake((modelName, id) => ({ id }));
                yield (0, properties_1.ReferenceProperty)(TestModel1, {
                    fetcher,
                }).createGetter(input)();
                const actual = fetcher.getCall(0).args[0];
                const expected = TestModel1;
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should take the smartObject as a value', () => __awaiter(void 0, void 0, void 0, function* () {
                const id = 'obj-id';
                const proto = (0, models_1.BaseModel)('name', {
                    properties: {
                        id: (0, properties_1.UniqueId)({ value: id }),
                        name: (0, properties_1.TextProperty)({}),
                    },
                });
                const input = proto.create({ id, name: 'name' });
                const instance = (yield (0, properties_1.ReferenceProperty)(TestModel1, {}).createGetter(input)());
                const actual = yield instance.get.id();
                const expected = 'obj-id';
                chai_1.assert.deepEqual(actual, expected);
            }));
            describe('#toObj()', () => {
                it('should use the getId of the smartObject passed in when toObj is called', () => __awaiter(void 0, void 0, void 0, function* () {
                    const proto = (0, models_1.BaseModel)('name', {
                        properties: {
                            id: (0, properties_1.UniqueId)({ value: 'obj-id' }),
                            name: (0, properties_1.TextProperty)({}),
                        },
                    });
                    const input = proto.create({ id: 'obj-id', name: 'name' });
                    const instance = (yield (0, properties_1.ReferenceProperty)(TestModel1, {}).createGetter(input)());
                    const actual = yield instance.toObj();
                    const expected = 'obj-id';
                    chai_1.assert.deepEqual(actual, expected);
                }));
                it('should return "obj-id" when switch-a-roo fetcher is used and toObj is called', () => __awaiter(void 0, void 0, void 0, function* () {
                    const input = 'obj-id';
                    const instance = (yield (0, properties_1.ReferenceProperty)(TestModel1, {
                        fetcher: () => Promise.resolve({ id: 'obj-id', prop: 'switch-a-roo' }),
                    }).createGetter(input)());
                    const actual = yield instance.toObj();
                    const expected = 'obj-id';
                    chai_1.assert.deepEqual(actual, expected);
                }));
            });
        });
    });
});
//# sourceMappingURL=properties.test.js.map