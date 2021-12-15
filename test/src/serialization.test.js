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
const chai_1 = require("chai");
const serialization_1 = require("../../src/serialization");
describe('/src/serialization.ts', () => {
    describe('#toObj()', () => {
        it('serialize a very basic input of key-value', () => __awaiter(void 0, void 0, void 0, function* () {
            const actual = yield (0, serialization_1.toJsonAble)({
                key: () => 'value',
                key2: () => 'value2',
            })();
            const expected = {
                key: 'value',
                key2: 'value2',
            };
            chai_1.assert.deepEqual(actual, expected);
        }));
        it('should call "toObj" on nested objects', () => __awaiter(void 0, void 0, void 0, function* () {
            const actual = yield (0, serialization_1.toJsonAble)({
                key: () => 'value',
                key2: () => ({
                    get: { complex: () => ({ func: 'func' }) },
                    toObj: () => ({ func: 'value' }),
                }),
            })();
            const expected = {
                key: 'value',
                key2: {
                    func: 'value',
                },
            };
            chai_1.assert.deepEqual(actual, expected);
        }));
        it('should call "toObj" on very nested objects', () => __awaiter(void 0, void 0, void 0, function* () {
            const actual = yield (0, serialization_1.toJsonAble)({
                key: () => 'value',
                key2: () => ({
                    toObj: () => ({ func: 'value' }),
                }),
            })();
            const expected = {
                key: 'value',
                key2: {
                    func: 'value',
                },
            };
            chai_1.assert.deepEqual(actual, expected);
        }));
        it('should set an undefined property to null', () => __awaiter(void 0, void 0, void 0, function* () {
            const actual = yield (0, serialization_1.toJsonAble)({
                key: () => 'value',
                key2: () => undefined,
            })();
            const expected = {
                key: 'value',
                key2: null,
            };
            chai_1.assert.deepEqual(actual, expected);
        }));
        it('should use the value null for null', () => __awaiter(void 0, void 0, void 0, function* () {
            const actual = yield (0, serialization_1.toJsonAble)({
                key: () => 'value',
                key2: () => null,
            })();
            const expected = {
                key: 'value',
                key2: null,
            };
            chai_1.assert.deepEqual(actual, expected);
        }));
        it('should return "2021-09-16T21:51:56.039Z" for the set date.', () => __awaiter(void 0, void 0, void 0, function* () {
            const actual = yield (0, serialization_1.toJsonAble)({
                myDate: () => new Date('2021-09-16T21:51:56.039Z'),
            })();
            const expected = {
                myDate: '2021-09-16T21:51:56.039Z',
            };
            chai_1.assert.deepEqual(actual, expected);
        }));
    });
});
//# sourceMappingURL=serialization.test.js.map