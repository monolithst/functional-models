"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getObjToArray = exports.createUuid = exports.toTitleCase = exports.loweredTitleCase = void 0;
const keyBy_1 = __importDefault(require("lodash/keyBy"));
// @ts-ignore
const get_random_values_1 = __importDefault(require("get-random-values"));
const HEX = 16;
const FOUR = 4;
const FIFTEEN = 15;
const getRandomValues = () => {
    const array = new Uint8Array(1);
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
const createUuid = () => {
    // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
    // @ts-ignore
    // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => {
        const value = getRandomValues()[0] & (FIFTEEN >> (c / FOUR));
        return (c ^ value).toString(HEX);
    });
};
exports.createUuid = createUuid;
const toTitleCase = (string) => {
    return `${string.slice(0, 1).toUpperCase()}${string.slice(1)}`;
};
exports.toTitleCase = toTitleCase;
const loweredTitleCase = (string) => {
    return `${string.slice(0, 1).toLowerCase()}${string.slice(1)}`;
};
exports.loweredTitleCase = loweredTitleCase;
const getObjToArray = (array) => {
    const obj = (0, keyBy_1.default)(array);
    return Object.assign(Object.assign({}, obj), { toArray: () => array });
};
exports.getObjToArray = getObjToArray;
