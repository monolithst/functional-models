"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const errors_1 = require("../../src/errors");
describe('/src/errors.ts', () => {
    describe('ValidationError', () => {
        it('should have the correct modelName', () => {
            const instance = new errors_1.ValidationError('modelName', {
                name: ['error1', 'error2'],
            });
            const actual = instance.modelName;
            const expected = 'modelName';
            chai_1.assert.equal(actual, expected);
        });
        it('should have the correct keysToErrors', () => {
            const instance = new errors_1.ValidationError('modelName', {
                name: ['error1', 'error2'],
            });
            const actual = instance.keysToErrors;
            const expected = { name: ['error1', 'error2'] };
            chai_1.assert.deepEqual(actual, expected);
        });
        it('should have the correct name', () => {
            const instance = new errors_1.ValidationError('modelName', {
                name: ['error1', 'error2'],
            });
            const actual = instance.name;
            const expected = 'ValidationError';
            chai_1.assert.equal(actual, expected);
        });
    });
});
//# sourceMappingURL=errors.test.js.map