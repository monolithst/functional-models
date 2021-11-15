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
exports.toObj = void 0;
const _getValue = (value) => __awaiter(void 0, void 0, void 0, function* () {
    if (value === undefined) {
        return null;
    }
    if (value === null) {
        return null;
    }
    const type = typeof value;
    const asFunction = value;
    if (type === 'function') {
        return _getValue(yield asFunction());
    }
    // Nested Object
    const asModel = value.toObj;
    if (asModel) {
        return _getValue(yield asModel.toObj());
    }
    // Dates
    const asDate = value;
    if (type === 'object' && asDate.toISOString) {
        return _getValue(asDate.toISOString());
    }
    return value;
});
const toObj = (keyToFunc) => () => __awaiter(void 0, void 0, void 0, function* () {
    return Object.entries(keyToFunc).reduce((acc, [key, value]) => __awaiter(void 0, void 0, void 0, function* () {
        const realAcc = yield acc;
        const trueValue = yield _getValue(yield value);
        return Object.assign(Object.assign({}, realAcc), { [key]: trueValue });
    }), Promise.resolve({}));
});
exports.toObj = toObj;
