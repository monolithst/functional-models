"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
class ValidationError extends Error {
    constructor(modelName, keysToErrors) {
        super(`${modelName} did not pass validation`);
        this.name = 'ValidationError';
        // @ts-ignore
        this.modelName = modelName;
        // @ts-ignore
        this.keysToErrors = keysToErrors;
    }
}
exports.ValidationError = ValidationError;
