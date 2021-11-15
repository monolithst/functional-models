"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceFunction = exports.Function = void 0;
const Function = (method) => (wrapped) => () => {
    return method(wrapped);
};
exports.Function = Function;
const InstanceFunction = (method) => {
    const r = (instance, ...args) => {
        return method(instance, ...args);
    };
    return r;
};
exports.InstanceFunction = InstanceFunction;
