"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjToArray = exports.createUuid = exports.toTitleCase = exports.loweredTitleCase = void 0;
var keyBy_1 = __importDefault(require("lodash/keyBy"));
// @ts-ignore
var get_random_values_1 = __importDefault(require("get-random-values"));
var HEX = 16;
var FOUR = 4;
var FIFTEEN = 15;
var getRandomValues = function () {
    var array = new Uint8Array(1);
    if (typeof window !== 'undefined') {
        if (window.crypto) {
            return window.crypto.getRandomValues(array);
        }
        // @ts-ignore
        if (window.msCrypto) {
            // @ts-ignore
            window.msCrypto.getRandomValues(array);
        }
        // @ts-ignore
        return (window.crypto || window.msCrypto).getRandomValues;
    }
    return (0, get_random_values_1.default)(array);
};
var createUuid = function () {
    // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
    // @ts-ignore
    // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
        var value = getRandomValues()[0] & (FIFTEEN >> (c / FOUR));
        return (c ^ value).toString(HEX);
    });
};
exports.createUuid = createUuid;
var toTitleCase = function (string) {
    return "" + string.slice(0, 1).toUpperCase() + string.slice(1);
};
exports.toTitleCase = toTitleCase;
var loweredTitleCase = function (string) {
    return "" + string.slice(0, 1).toLowerCase() + string.slice(1);
};
exports.loweredTitleCase = loweredTitleCase;
var getObjToArray = function (array) {
    var obj = (0, keyBy_1.default)(array);
    return __assign(__assign({}, obj), { toArray: function () { return array; } });
};
exports.getObjToArray = getObjToArray;
