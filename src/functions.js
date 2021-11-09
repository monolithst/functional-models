"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Function = void 0;
const Function = (method) => (wrapped) => () => {
    return method(wrapped);
};
exports.Function = Function;
