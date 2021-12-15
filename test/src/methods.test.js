"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const models_1 = require("../../src/models");
const properties_1 = require("../../src/properties");
const methods_1 = require("../../src/methods");
describe('/src/methods.js', () => {
    describe('#InstanceMethod()', () => {
        it('should return "Hello-world" when passed in', () => {
            const method = sinon_1.default.stub().callsFake(input => {
                return `${input.get.text()}-world`;
            });
            const myInstanceMethod = (0, methods_1.WrapperInstanceMethod)(method);
            const wrappedObj = 'Hello';
            const model = (0, models_1.BaseModel)('Test', {
                properties: { text: (0, properties_1.TextProperty)() },
            });
            const modelInstance = model.create({ text: 'Hello' });
            const actual = myInstanceMethod(modelInstance);
            const expected = 'Hello-world';
            chai_1.assert.equal(actual, expected);
        });
        it('should call the method when InstanceMethod()() called', () => {
            const method = sinon_1.default.stub().callsFake(input => {
                return `${input}-world`;
            });
            const myInstanceMethod = (0, methods_1.WrapperInstanceMethod)(method);
            const model = (0, models_1.BaseModel)('Test', {
                properties: { text: (0, properties_1.TextProperty)() },
            });
            const modelInstance = model.create({ text: 'Hello' });
            const actual = myInstanceMethod(modelInstance);
            sinon_1.default.assert.calledOnce(method);
        });
        it('should not call the method when InstanceMethod() called', () => {
            const method = sinon_1.default.stub().callsFake(input => {
                return `${input}-world`;
            });
            const myInstanceMethod = (0, methods_1.WrapperInstanceMethod)(method);
            sinon_1.default.assert.notCalled(method);
        });
    });
});
//# sourceMappingURL=methods.test.js.map