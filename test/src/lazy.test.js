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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = __importDefault(require("sinon"));
const lazy_1 = require("../../src/lazy");
describe('/src/lazy.ts', () => {
    describe('#lazyValue()', () => {
        it('should only call the method passed in once even after two calls', () => __awaiter(void 0, void 0, void 0, function* () {
            const method = sinon_1.default.stub().returns('hello-world');
            const instance = (0, lazy_1.lazyValue)(method);
            yield instance();
            yield instance();
            sinon_1.default.assert.calledOnce(method);
        }));
    });
});
//# sourceMappingURL=lazy.test.js.map