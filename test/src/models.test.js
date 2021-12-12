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
const functions_1 = require("../../src/functions");
const properties_2 = require("../../src/properties");
const TEST_MODEL_1 = (0, models_1.Model)('MyModel', {
    properties: {
        name: (0, properties_1.TextProperty)(),
    },
});
describe('/src/models.ts', () => {
    describe('#Model()', () => {
        it('should pass a functional instance to the instanceMethods by the time the function is called by a client', () => {
            const model = (0, models_1.Model)('ModelName', {
                properties: {
                    name: (0, properties_1.TextProperty)(),
                },
                instanceMethods: {
                    func1: (0, functions_1.InstanceMethod)((instance) => {
                        // @ts-ignore
                        return instance.methods.func2();
                    }),
                    func2: (instance) => {
                        return 'from instance func2';
                    },
                }
            });
            const instance = model.create({ name: 'name' });
            const actual = instance.methods.func1();
            const expected = 'from instance func2';
            chai_1.assert.deepEqual(actual, expected);
        });
        it('should pass the clients arguments before the model is passed', () => {
            const model = (0, models_1.Model)('ModelName', {
                properties: {},
                modelMethods: {
                    func1: (0, functions_1.ModelMethod)((model, input) => {
                        return `${input} ${model.methods.func2()}`;
                    }),
                    func2: (0, functions_1.ModelMethod)(model => {
                        return 'from func2';
                    }),
                },
            });
            const actual = model.methods.func1('hello');
            const expected = 'hello from func2';
            chai_1.assert.deepEqual(actual, expected);
        });
        it('should pass a functional model to the modelFunction by the time the function is called by a client', () => {
            const model = (0, models_1.Model)('ModelName', {
                properties: {},
                modelMethods: {
                    func1: model => {
                        return model.methods.func2();
                    },
                    func2: model => {
                        return 'from func2';
                    },
                },
            });
            const actual = model.methods.func1();
            const expected = 'from func2';
            chai_1.assert.deepEqual(actual, expected);
        });
        it('should find model.myString when modelExtension has myString function in it', () => {
            const model = (0, models_1.Model)('ModelName', {
                properties: {},
                modelMethods: {
                    myString: model => {
                        return 'To String';
                    },
                },
            });
            chai_1.assert.isFunction(model.methods.myString);
        });
        describe('#getPrimaryKeyName()', () => {
            it('should return "primaryKey" when this value is passed in as the primaryKey', () => {
                const expected = 'primaryKey';
                const model = (0, models_1.Model)('ModelName', {
                    getPrimaryKey: () => expected,
                    properties: {},
                    modelMethods: {
                        myString: model => {
                            return 'To String';
                        },
                    },
                });
                const actual = model.getPrimaryKeyName();
                chai_1.assert.equal(actual, expected);
            });
        });
        describe('#create()', () => {
            it('should have a references.theReference when properties has a ReferenceProperty named "theReference"', () => {
                const model = (0, models_1.Model)('ModelName', {
                    properties: {
                        theReference: (0, properties_1.ReferenceProperty)(TEST_MODEL_1),
                    }
                });
                const instance = model.create({});
                chai_1.assert.isFunction(instance.references.theReference);
            });
            it('should have an "get.id" field when no primaryKey is passed', () => {
                const model = (0, models_1.Model)('ModelName', {
                    properties: {},
                });
                const instance = model.create({});
                chai_1.assert.isFunction(instance.get.id);
            });
            it('should have an "getMyPrimaryKeyId" field when "myPrimaryKeyId" is passed as the "getPrimaryKey" is passed', () => {
                const model = (0, models_1.Model)('ModelName', {
                    getPrimaryKey: () => 'myPrimaryKeyId',
                    properties: {
                        myPrimaryKeyId: (0, properties_2.UniqueId)(),
                    },
                });
                const instance = model.create({ myPrimaryKeyId: 'blah' });
                chai_1.assert.isFunction(instance.get.myPrimaryKeyId);
            });
            it('should find instance.methods.toString when in instanceMethods', () => {
                const model = (0, models_1.Model)('ModelName', {
                    properties: {},
                    instanceMethods: {
                        toString: instance => {
                            return 'An instance';
                        },
                    },
                });
                const instance = model.create({});
                chai_1.assert.isFunction(instance.methods.toString);
            });
            it('should call all the instanceCreatedCallback functions when create() is called', () => {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.TextProperty)({ required: true }),
                    }
                };
                const callbacks = [sinon_1.default.stub(), sinon_1.default.stub()];
                const model = (0, models_1.Model)('name', input, {
                    instanceCreatedCallback: callbacks,
                });
                model.create({ myProperty: 'value' });
                callbacks.forEach(x => {
                    sinon_1.default.assert.calledOnce(x);
                });
            });
            it('should call the instanceCreatedCallback function when create() is called', () => {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.TextProperty)({ required: true }),
                    }
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
                    properties: {
                        myProperty: (0, properties_1.TextProperty)({ required: true }),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                chai_1.assert.doesNotThrow(() => {
                    model.create({});
                });
            });
            it('should return an object that contains getModel().getModelDefinition().properties.myProperty', () => {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.TextProperty)({ required: true })
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'value' });
                const actual = instance.getModel().getModelDefinition().properties.myProperty;
                chai_1.assert.isOk(actual);
            });
            it('should flow through the additional special functions within the keyValues', () => {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.TextProperty)({ required: true }),
                    },
                    instanceMethods: {
                        custom: () => 'works',
                    },
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'value' });
                const actual = instance.methods.custom();
                const expected = 'works';
                chai_1.assert.equal(actual, expected);
            });
            it('should return an object that contains .getModel().getName()===test-the-name', () => {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.TextProperty)({ required: true }),
                    }
                };
                const model = (0, models_1.Model)('test-the-name', input);
                const instance = model.create({ myProperty: 'value' });
                const actual = instance.getModel().getName();
                const expected = 'test-the-name';
                chai_1.assert.deepEqual(actual, expected);
            });
            it('should use the value passed in when Property.defaultValue and Property.value are not set', () => {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.TextProperty)({ required: true }),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'passed-in' });
                const actual = instance.get.myProperty();
                const expected = 'passed-in';
                chai_1.assert.deepEqual(actual, expected);
            });
            it('should use the value for Property.value when even if Property.defaultValue is set and a value is passed in', () => {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.Property)('MyProperty', {
                            value: 'value',
                            defaultValue: 'default-value',
                        }),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'passed-in' });
                const actual = instance.get.myProperty();
                const expected = 'value';
                chai_1.assert.deepEqual(actual, expected);
            });
            it('should use the value for Property.value when even if Property.defaultValue is not set and a value is passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.Property)('MyProperty', { value: 'value' }),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: 'passed-in' });
                const actual = instance.get.myProperty();
                const expected = 'value';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should use the value for Property.defaultValue when Property.value is not set and no value is passed in', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.Property)('MyProperty', { defaultValue: 'defaultValue' }),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                // @ts-ignore
                const instance = model.create({});
                const actual = instance.get.myProperty();
                const expected = 'defaultValue';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should use the value for Property.defaultValue when Property.value is not set and null is passed as a value', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    properties: {
                        myProperty: (0, properties_1.Property)('MyProperty', { defaultValue: 'defaultValue' }),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ myProperty: null });
                const actual = instance.get.myProperty();
                const expected = 'defaultValue';
                chai_1.assert.deepEqual(actual, expected);
            }));
            it('should return a model with get.id and get.type for the provided valid keyToProperty', () => {
                const input = {
                    properties: {
                        id: (0, properties_2.UniqueId)({ required: true }),
                        type: (0, properties_1.Property)('MyProperty', {}),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const actual = model.create({ id: 'my-id', type: 'my-type' });
                chai_1.assert.isOk(actual.get.id);
                chai_1.assert.isOk(actual.get.type);
            });
            it('should return the id when get.id() is called', () => {
                const expected = 'my-id';
                const input = {
                    properties: {
                        type: (0, properties_1.Property)('MyProperty', {}),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ id: expected, type: 'my-type' });
                const actual = instance.get.id();
                chai_1.assert.equal(actual, expected);
            });
            it('should return a model where validate returns one error for id', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    properties: {
                        id: (0, properties_1.Property)('MyId', { required: true }),
                        type: (0, properties_1.Property)('MyProperty', {}),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ type: 'my-type' });
                const actual = yield instance.validate();
                const expected = 1;
                chai_1.assert.equal(Object.values(actual).length, expected);
            }));
            it('should return a model where validate returns one error for the missing text property', () => __awaiter(void 0, void 0, void 0, function* () {
                const input = {
                    properties: {
                        id: (0, properties_1.Property)('MyProperty', { required: true }),
                        text: (0, properties_1.TextProperty)({ required: true }),
                    }
                };
                const model = (0, models_1.Model)('name', input);
                const instance = model.create({ id: 'my-id' });
                const actual = yield instance.validate();
                const expected = 1;
                chai_1.assert.equal(Object.values(actual).length, expected);
            }));
        });
        it('should return an object with a function "create" when called once with valid data', () => {
            const actual = (0, models_1.Model)('name', { properties: {} });
            chai_1.assert.isFunction(actual.create);
        });
        describe('#references.getMyReferencedId()', () => {
            it('should return the id from the ReferenceProperty', () => {
                const model = (0, models_1.Model)('ModelName', {
                    properties: {
                        myReference: (0, properties_1.ReferenceProperty)(TEST_MODEL_1),
                    }
                });
                const instance = model.create({ myReference: 'unit-test-id' });
                const actual = instance.references.myReference();
                const expected = 'unit-test-id';
                chai_1.assert.deepEqual(actual, expected);
            });
        });
        describe('#getPrimaryKey()', () => {
            it('should return the id field when no primaryKey is passed', () => __awaiter(void 0, void 0, void 0, function* () {
                const model = (0, models_1.Model)('ModelName', { properties: {} });
                const expected = 'my-primary-key';
                const instance = model.create({ id: expected });
                const actual = yield instance.getPrimaryKey();
                chai_1.assert.equal(actual, expected);
            }));
            it('should return the primaryKey field when "primaryKey" is passed as primaryKey', () => __awaiter(void 0, void 0, void 0, function* () {
                const model = (0, models_1.Model)('ModelName', {
                    getPrimaryKey: () => 'primaryKey',
                    properties: {},
                });
                const expected = 'my-primary-key';
                const instance = model.create({ primaryKey: expected });
                const actual = yield instance.getPrimaryKey();
                chai_1.assert.equal(actual, expected);
            }));
        });
    });
});
//# sourceMappingURL=models.test.js.map