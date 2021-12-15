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
Object.defineProperty(exports, "__esModule", { value: true });
const cucumber_1 = require("@cucumber/cucumber");
const chai_1 = require("chai");
const models_1 = require("../src/models");
const methods_1 = require("../src/methods");
const properties_1 = require("../src/properties");
const TE_FULL_TEST = () => {
    const m = (0, models_1.BaseModel)('TSFullTests', {
        properties: {
            id: (0, properties_1.UniqueId)({ value: 'my-unique-id' }),
            name: (0, properties_1.TextProperty)({ required: true }),
            data: (0, properties_1.ObjectProperty)({}),
            notRequired: (0, properties_1.TextProperty)({}),
        },
        instanceMethods: {
            myMethod: (0, methods_1.WrapperInstanceMethod)((instance, args) => {
                return 'InstanceMethod';
            }),
        },
        modelMethods: {
            myModelMethod: (0, methods_1.WrapperModelMethod)((model, args) => {
                return 'ModelMethod';
            }),
        },
    });
    return m;
};
const TE_FULL_TEST_1 = () => {
    return {
        id: 'my-unique-id',
        name: 'My name',
        data: { my: 'data' },
        notRequired: null,
    };
};
const DATA_SET = {
    TE_FULL_TEST_1,
};
const MODEL_SET = {
    TE_FULL_TEST,
};
(0, cucumber_1.Given)('model {word} is used', function (modelName) {
    this.theModel = MODEL_SET[modelName]();
});
(0, cucumber_1.When)('a model instanced is created is called on model with {word}', function (dataName) {
    return __awaiter(this, void 0, void 0, function* () {
        this.theModelInstance = this.theModel.create(DATA_SET[dataName]());
    });
});
(0, cucumber_1.When)('toObj is called on the model instance', function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.results = yield this.theModelInstance.toObj();
    });
});
(0, cucumber_1.Then)('the results match {word} obj data', function (dataName) {
    const data = DATA_SET[dataName]();
    chai_1.assert.deepEqual(data, this.results);
});
(0, cucumber_1.When)('instance method {word} is called', function (methodName) {
    return __awaiter(this, void 0, void 0, function* () {
        this.instanceMethodActual = yield this.theModelInstance.methods[methodName]();
    });
});
(0, cucumber_1.Then)('the result of instance method is {word}', function (expected) {
    const actual = this.instanceMethodActual;
    chai_1.assert.equal(actual, expected);
});
(0, cucumber_1.When)('model method {word} is called', function (methodName) {
    return __awaiter(this, void 0, void 0, function* () {
        this.modelMethodActual = yield this.theModel.methods[methodName]();
    });
});
(0, cucumber_1.Then)('the result of model method is {word}', function (expected) {
    const actual = this.modelMethodActual;
    chai_1.assert.equal(actual, expected);
});
(0, cucumber_1.When)('validate is called on model instance', function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.validationActual = yield this.theModelInstance.validate();
    });
});
(0, cucumber_1.Then)('the model instance validated successfully', function () {
    const expected = {};
    chai_1.assert.deepEqual(this.validationActual, expected);
});
//# sourceMappingURL=tssteps.js.map