"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Function = void 0;
var Function = function (method) { return function (wrapped) { return function () {
    return method(wrapped);
}; }; };
exports.Function = Function;
