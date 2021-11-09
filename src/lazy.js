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
exports.lazyValue = void 0;
const lazyValue = (method) => {
    /* eslint-disable functional/no-let */
    let value = undefined;
    let called = false;
    return (...args) => __awaiter(void 0, void 0, void 0, function* () {
        if (!called) {
            called = true;
            value = yield method(...args);
            // eslint-disable-next-line require-atomic-updates
        }
        return value;
    });
    /* eslint-enable functional/no-let */
};
exports.lazyValue = lazyValue;
