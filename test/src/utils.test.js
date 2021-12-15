"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon_1 = __importDefault(require("sinon"));
const proxyquire_1 = __importDefault(require("proxyquire"));
const utils_1 = require("../../src/utils");
describe('/src/utils.ts', () => {
    describe('#toTitleCase()', () => {
        it('should make camelCase into CamelCase', () => {
            const input = 'camelCase';
            const actual = (0, utils_1.toTitleCase)(input);
            const expected = 'CamelCase';
            chai_1.assert.equal(actual, expected);
        });
    });
    describe('#loweredTitleCase()', () => {
        it('should turn TitleCase into titleCase', () => {
            const actual = (0, utils_1.loweredTitleCase)('TitleCase');
            const expected = 'titleCase';
            chai_1.assert.equal(actual, expected);
        });
    });
    describe('#createUuid()', () => {
        before(() => {
            // @ts-ignore
            globalThis.global.window = undefined;
        });
        after(() => {
            // @ts-ignore
            globalThis.global.window = undefined;
        });
        describe('when not having access to "window"', () => {
            it('should call get-random-values 31 times with hello-crypto', () => {
                const getRandomValues = sinon_1.default.stub().returns('hello-crypto');
                const utils = (0, proxyquire_1.default)('../../src/utils', {
                    'get-random-values': getRandomValues,
                });
                const actual = utils.createUuid();
                sinon_1.default.assert.callCount(getRandomValues, 31);
            });
        });
        describe('when in a browser with "window"', () => {
            it('should call window.crypto when it exists 31 times with hello-crypto', () => {
                const getRandomValues = sinon_1.default.stub().returns('hello-crypto');
                window = {
                    // @ts-ignore
                    crypto: {
                        getRandomValues,
                    },
                };
                const actual = (0, utils_1.createUuid)();
                sinon_1.default.assert.callCount(getRandomValues, 31);
            });
            it('should call window.myCrypto when it exists 31 times with hello-crypto', () => {
                const getRandomValues = sinon_1.default.stub().returns('hello-crypto');
                window = {
                    // @ts-ignore
                    msCrypto: {
                        getRandomValues,
                    },
                };
                const actual = (0, utils_1.createUuid)();
                sinon_1.default.assert.callCount(getRandomValues, 31);
            });
            it('should call get-random-values 31 times with hello-crypto if crypto and msCrypto are not available', () => {
                const getRandomValues = sinon_1.default.stub().returns('hello-crypto');
                // @ts-ignore
                window = {};
                const utils = (0, proxyquire_1.default)('../../src/utils', {
                    'get-random-values': getRandomValues,
                });
                const actual = utils.createUuid();
                sinon_1.default.assert.callCount(getRandomValues, 31);
            });
        });
    });
});
//# sourceMappingURL=utils.test.js.map