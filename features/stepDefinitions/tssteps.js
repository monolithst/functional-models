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
const models_1 = require("../../src/models");
const functions_1 = require("../../src/functions");
const properties_1 = require("../../src/properties");
const TE_FULL_TEST = () => {
    const m = (0, models_1.Model)('TSFullTests', {
        name: (0, properties_1.TextProperty)({}),
        myMethod: (0, functions_1.InstanceFunction)((instance) => { })
    });
    m.create({ name: 'text' }).functions.myMethod();
};
const TE_FULL_TEST_1 = () => {
};
const DATA_SET = {
    TE_FULL_TEST_1,
};
const MODEL_SET = {
    TE_FULL_TEST,
};
(0, cucumber_1.Given)('model {word} is used', function (modelName) {
    return __awaiter(this, void 0, void 0, function* () {
        this.model = yield MODEL_SET[modelName]();
    });
});
(0, cucumber_1.When)('a model instanced is created is called on model with {word}', function (dataName) {
    return __awaiter(this, void 0, void 0, function* () {
        this.modelInstance = this.model.create(yield DATA_SET[dataName]);
    });
});
(0, cucumber_1.When)('toObj is called on the model instance', function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.results = yield this.modelInstance.toObj();
    });
});
(0, cucumber_1.Then)('the results match {word} obj data', function (dataName) {
    const data = DATA_SET[dataName];
    chai_1.assert.deepEqual(data, this.results);
});
