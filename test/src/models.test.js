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
const sinon_1 = __importDefault(require("sinon"));
const chai_1 = require("chai");
const models_1 = require("../../src/models");
const properties_1 = require("../../src/properties");
const TEST_MODEL_1 = (0, models_1.Model)('MyModel', {});
describe('/src/models.ts', () => {
    describe('#Model()', () => {
        it('should pass a functional instance to the instanceFunctions by the time the function is called by a client', () => {
            const model = (0, models_1.Model)('ModelName', {}, {
                instanceFunctions: {
                    func1: (instance) => {
                        // @ts-ignore
                        return instance.functions.func2();
                    },
                    func2: (instance) => {
                        return 'from instance func2';
                    },
                },
            });
            const instance = model.create({});
            const actual = instance.functions.func1();
            const expected = 'from instance func2';
            chai_1.assert.deepEqual(actual, expected);
        });
        it('should the clients arguments before the model is passed', () => {
            const model = (0, models_1.Model)('ModelName', {}, {
                modelFunctions: {
                    func1: (model) => (input) => {
                        return `${input} ${model.func2()}`;
                    },
                    func2: model => () => {
                        return 'from func2';
                    },
                },
            });
            const actual = model.func1('hello');
            const expected = 'hello from func2';
            chai_1.assert.deepEqual(actual, expected);
        });
        it('should pass a functional model to the modelFunction by the time the function is called by a client', () => {
            const model = (0, models_1.Model)('ModelName', {}, {
                modelFunctions: {
                    func1: model => () => {
                        return model.func2();
                    },
                    func2: model => () => {
                        return 'from func2';
                    },
                },
            });
            const actual = model.func1();
            const expected = 'from func2';
            chai_1.assert.deepEqual(actual, expected);
        });
        it('should find model.myString when modelExtension has myString function in it', () => {
            const model = (0, models_1.Model)('ModelName', {}, {
                modelFunctions: {
                    myString: model => () => {
                        return 'To String';
                    },
                },
            });
            chai_1.assert.isFunction(model.myString);
        });
        describe('#getPrimaryKeyName()', () => {
            it('should return "primaryKey" when this value is passed in as the primaryKey', () => {
                const expected = 'primaryKey';
                const model = (0, models_1.Model)('ModelName', {}, {
                    primaryKey: expected,
                    modelFunctions: {
                        myString: model => () => {
                            return 'To String';
                        },
                    },
                });
                const actual = model.getPrimaryKeyName();
                chai_1.assert.equal(actual, expected);
            });
        });
        describe('#create()', () => {
            it('should have a meta.references.getTheReferenceId when the property has meta.getReferencedId and the key is theReference', () => {
                const model = (0, models_1.Model)('ModelName', {
                    theReference: (0, properties_1.ReferenceProperty)(TEST_MODEL_1),
                });
                const instance = model.create({});
                chai_1.assert.isFunction(instance.meta.references.getTheReferenceId);
            });
            it('should have an "getId" field when no primaryKey is passed', () => {
                const model = (0, models_1.Model)('ModelName', {}, {
                    instanceFunctions: {
                        toString: instance => () => {
                            return 'An instance';
                        },
                    },
                });
                const instance = model.create({});
                chai_1.assert.isFunction(instance.getId);
            });
            it('should have an "getMyPrimaryKeyId" field when "myPrimaryKeyId" is passed as the "primaryKey" is passed', () => {
                const model = (0, models_1.Model)('ModelName', {}, {
                    primaryKey: 'myPrimaryKeyId',
                    instanceFunctions: {
                        toString: instance => () => {
                            return 'An instance';
                        },
                    },
                });
                const instance = model.create({});
                chai_1.assert.isFunction(instance.getMyPrimaryKeyId);
            });
            it('should find instance.functions.toString when in instanceFunctions', () => {
                const model = (0, models_1.Model)('ModelName', {}, {
                    instanceFunctions: {
                        toString: instance => () => {
                            return 'An instance';
                        },
                    },
                });
                const instance = model.create({});
                chai_1.assert.isFunction(instance.functions.toString);
            });
            it('should call the instanceCreatedCallback function when create() is called', () => {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                };
                const callback = sinon_1.default.stub();
                const model = (0, models_1.Model)('name', input, {
                    instanceCreatedCallback: callback,
                });
                model.create({ myProperty: 'value' });
                sinon_1.default.assert.calledOnce(callback);
            });
            it('should not throw an exception if nothing is passed into function', () => {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                };
                const model = (0, models_1.Model)('name', input);
                chai_1.assert.doesNotThrow(() => {
                    model.create();
                });
            });
            it('should return an object that contains meta.getModel().getProperties().myProperty', () => {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'value' });
                const actual = instance.meta.getModel().getProperties().myProperty;
                chai_1.assert.isOk(actual);
            });
            it('should combine the meta within the instance values', () => {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({
                    myProperty: 'value',
                    meta: { random: () => 'random' },
                });
                const actual = instance.meta.random();
                const expected = 'random';
                chai_1.assert.equal(actual, expected);
            });
            it('should flow through the additional special functions within the keyValues', () => {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                    functions: {
                        custom: () => 'works',
                    },
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'value' });
                const actual = instance.functions.custom();
                const expected = 'works';
                chai_1.assert.equal(actual, expected);
            });
            it('should return an object that contains meta.getModel().getName()===test-the-name', () => {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                };
                const model = (0, models_1.Model)('test-the-name', input);
                const instance = model.create({ myProperty: 'value' });
                const actual = instance.meta.getModel().getName();
                const expected = 'test-the-name';
                chai_1.assert.deepEqual(actual, expected);
            });
            it('should return an object that contains meta.getModel().getProperties().myProperty', () => {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'value' });
                const actual = instance.meta.getModel().getProperties().myProperty;
                chai_1.assert.isOk(actual);
            });
            it('should use the value passed in when Property.defaultValue and Property.value are not set', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    myProperty: (0, properties_1.Property)({ required: true }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'passed-in' });
                const actual = yield instance.getMyProperty();
                const expected = 'passed-in';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should use the value for Property.value when even if Property.defaultValue is set and a value is passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    myProperty: (0, properties_1.Property)('MyProperty', {
                        value: 'value',
                        defaultValue: 'default-value',
                    }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'passed-in' });
                const actual = yield instance.getMyProperty();
                const expected = 'value';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should use the value for Property.value when even if Property.defaultValue is not set and a value is passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    myProperty: (0, properties_1.Property)('MyProperty', { value: 'value' }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'passed-in' });
                const actual = yield instance.getMyProperty();
                const expected = 'value';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should use the value for Property.defaultValue when Property.value is not set and no value is passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    myProperty: (0, properties_1.Property)('MyProperty', { defaultValue: 'defaultValue' }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({});
                const actual = yield instance.getMyProperty();
                const expected = 'defaultValue';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should use the value for Property.defaultValue when Property.value is not set and null is passed as a value', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    myProperty: (0, properties_1.Property)('MyProperty', { defaultValue: 'defaultValue' }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: null });
                const actual = yield instance.getMyProperty();
                const expected = 'defaultValue';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return a model with getId and getType for the provided valid keyToProperty', () => {
                const input = {
                    id: (0, properties_1.Property)('MyProperty', { required: true }),
                    type: (0, properties_1.Property)('MyProperty'),
                };
                const model = (0, models_1.Model)('name', input);
                const actual = model.create({ id: 'my-id', type: 'my-type' });
                chai_1.assert.isOk(actual.getId);
                chai_1.assert.isOk(actual.getType);
            });
            it('should return a model where validate returns one error for id', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    id: (0, properties_1.Property)('MyProperty', { required: true }),
                    type: (0, properties_1.Property)('MyProperty'),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ type: 'my-type' });
                const actual = yield instance.functions.validate();
                const expected = 1;
                chai_1.assert.equal(Object.values(actual).length, expected);
            }));
            it('should return a model where validate returns one error for the missing text property', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    id: (0, properties_1.Property)('MyProperty', { required: true }),
                    text: (0, properties_1.TextProperty)({ required: true }),
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ id: 'my-id' });
                const actual = yield instance.functions.validate();
                const expected = 1;
                chai_1.assert.equal(Object.values(actual).length, expected);
            }));
        });
        it('should return an object with a function "create" when called once with valid data', () => {
            const actual = (0, models_1.Model)('name', {});
            chai_1.assert.isFunction(actual.create);
        });
        it('should throw an exception if a key "model" is passed in', () => {
            chai_1.assert.throws(() => {
                (0, models_1.Model)('name', { model: 'weeee' }).create();
            });
        });
        describe('#meta.references.getMyReferencedId()', () => {
            it('should return the id from the ReferenceProperty', () => {
                const model = (0, models_1.Model)('ModelName', {
                    myReference: (0, properties_1.ReferenceProperty)(TEST_MODEL_1),
                });
                const instance = model.create({ myReference: 'unit-test-id' });
                const actual = instance.meta.references.getMyReferenceId();
                const expected = 'unit-test-id';
                chai_1.assert.deepEqual(actual, expected);
            });
        });
        describe('#functions.getPrimaryKey()', () => {
            it('should return the id field when no primaryKey is passed', () => __awaiter(void 0, void 0, void 0, function* () {
                const model = (0, models_1.Model)('ModelName', {}, {
                    instanceFunctions: {
                        toString: instance => () => {
                            return 'An instance';
                        },
                    },
                });
                const expected = 'my-primary-key';
                const instance = model.create({ id: expected });
                const actual = yield instance.functions.getPrimaryKey();
                chai_1.assert.equal(actual, expected);
            }));
            it('should return the primaryKey field when "primaryKey" is passed as primaryKey', () => __awaiter(void 0, void 0, void 0, function* () {
                const model = (0, models_1.Model)('ModelName', {}, {
                    primaryKey: 'primaryKey',
                    instanceFunctions: {
                        toString: instance => () => {
                            return 'An instance';
                        },
                    },
                });
                const expected = 'my-primary-key';
                const instance = model.create({ primaryKey: expected });
                const actual = yield instance.functions.getPrimaryKey();
                chai_1.assert.equal(actual, expected);
            }));
        });
    });
});
