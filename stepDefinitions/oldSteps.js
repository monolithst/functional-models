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
const chai_1 = require("chai");
const flatMap_1 = __importDefault(require("lodash/flatMap"));
const cucumber_1 = require("@cucumber/cucumber");
const src_1 = require("../src");
const instanceToString = (0, src_1.WrapperInstanceMethod)(modelInstance => {
    return `${modelInstance.getModel().getName()}-Instance`;
});
const instanceToJson = (0, src_1.WrapperInstanceMethod)((modelInstance) => __awaiter(void 0, void 0, void 0, function* () {
    return JSON.stringify(yield modelInstance.toObj());
}));
const modelToString = (0, src_1.WrapperModelMethod)(model => {
    return `${model.getName()}-[${Object.keys(model.getModelDefinition().properties).join(',')}]`;
});
const modelWrapper = (0, src_1.WrapperModelMethod)(model => {
    return model;
});
const MODEL_DEFINITIONS = {
    FunctionModel1: (0, src_1.BaseModel)('FunctionModel1', {
        properties: {
            id: (0, src_1.UniqueId)({ required: true }),
            name: (0, src_1.TextProperty)({ required: true }),
        },
        modelMethods: {
            modelWrapper,
        },
        instanceMethods: {
            toString: instanceToString,
            toJson: instanceToJson,
        },
    }),
    TestModel1: (0, src_1.BaseModel)('TestModel1', {
        properties: {
            name: (0, src_1.Property)('Text', { required: true }),
            type: (0, src_1.Property)('Type', { required: true, isString: true }),
            flag: (0, src_1.Property)('Flag', { required: true, isNumber: true }),
        },
    }),
    ArrayModel1: (0, src_1.BaseModel)('ArrayModel1', {
        properties: {
            ArrayProperty: (0, src_1.Property)('Array', {
                isArray: true,
                validators: [src_1.validation.arrayType(src_1.validation.TYPE_PRIMITIVES.integer)],
            }),
        },
    }),
    ArrayModel2: (0, src_1.BaseModel)('ArrayModel2', {
        properties: {
            ArrayProperty: (0, src_1.Property)('Array', { isArray: true }),
        },
    }),
    ArrayModel3: (0, src_1.BaseModel)('ArrayModel3', {
        properties: {
            ArrayProperty: (0, src_1.ArrayProperty)({}),
        },
    }),
    ArrayModel4: (0, src_1.BaseModel)('ArrayModel4', {
        properties: {
            ArrayProperty: (0, src_1.ArrayProperty)({
                choices: [4, 5, 6],
                validators: [src_1.validation.arrayType(src_1.validation.TYPE_PRIMITIVES.integer)],
            }),
        },
    }),
};
const MODEL_INPUT_VALUES = {
    FunctionModelData1: {
        id: 'my-id',
        name: 'function-model-name',
    },
    TestModel1a: {
        name: 'my-name',
        type: 1,
        flag: '1',
    },
    TestModel1b: {
        name: 'my-name',
        type: 'a-type',
        flag: 1,
    },
    ArrayModelData1: {
        ArrayProperty: [1, 2, 3, 4, 5],
    },
    ArrayModelData2: {
        ArrayProperty: 'a-string',
    },
    ArrayModelData3: {
        ArrayProperty: ['a-string', 'a-string2'],
    },
    ArrayModelData4: {
        ArrayProperty: ['a-string', 1, {}, true],
    },
    ArrayModelData5: {
        ArrayProperty: [4, 5, 5, 5, 6],
    },
    ArrayModelData6: {
        ArrayProperty: [4, 5, 5, 5, 6, 1],
    },
};
const EXPECTED_FIELDS = {
    TestModel1b: ['name', 'type', 'flag'],
};
(0, cucumber_1.Given)('the {word} has been created, with {word} inputs provided', function (modelDefinition, modelInputValues) {
    // @ts-ignore
    const def = MODEL_DEFINITIONS[modelDefinition];
    this.model = def;
    // @ts-ignore
    const input = MODEL_INPUT_VALUES[modelInputValues];
    if (!def) {
        throw new Error(`${modelDefinition} did not result in a definition`);
    }
    if (!input) {
        throw new Error(`${modelInputValues} did not result in an input`);
    }
    this.instance = def.create(input);
});
(0, cucumber_1.When)('functions.validate is called', function () {
    // @ts-ignore
    return this.instance.validate().then(x => {
        this.errors = x;
    });
});
(0, cucumber_1.Then)('an array of {int} errors is shown', function (errorCount) {
    const errors = (0, flatMap_1.default)(Object.values(this.errors));
    if (errors.length !== errorCount) {
        console.error(this.errors);
    }
    chai_1.assert.equal(errors.length, errorCount);
});
(0, cucumber_1.Given)('{word} model is used', function (modelDefinition) {
    // @ts-ignore
    const def = MODEL_DEFINITIONS[modelDefinition];
    if (!def) {
        throw new Error(`${modelDefinition} did not result in a definition`);
    }
    this.modelDefinition = def;
    this.model = def;
});
(0, cucumber_1.When)('{word} data is inserted', function (modelInputValues) {
    // @ts-ignore
    const input = MODEL_INPUT_VALUES[modelInputValues];
    if (!input) {
        throw new Error(`${modelInputValues} did not result in an input`);
    }
    this.instance = this.modelDefinition.create(input);
});
(0, cucumber_1.Then)('{word} expected property is found', function (properties) {
    // @ts-ignore
    const propertyArray = EXPECTED_FIELDS[properties];
    if (!propertyArray) {
        throw new Error(`${properties} did not result in properties`);
    }
    // @ts-ignore
    propertyArray.forEach(key => {
        if (!(key in this.instance.get)) {
            throw new Error(`Did not find ${key} in model`);
        }
    });
});
(0, cucumber_1.Then)('the {word} property is called on the model', function (property) {
    this.results = this.instance.get[property]();
});
(0, cucumber_1.Then)('the array values match', function (table) {
    return __awaiter(this, void 0, void 0, function* () {
        const expected = JSON.parse(table.rowsHash().array);
        chai_1.assert.deepEqual(yield this.results, expected);
    });
});
(0, cucumber_1.Then)('{word} property is found', function (propertyKey) {
    chai_1.assert.isFunction(this.instance.get[propertyKey]);
});
(0, cucumber_1.Then)('{word} instance function is found', function (instanceFunctionKey) {
    chai_1.assert.isFunction(this.instance.methods[instanceFunctionKey]);
});
(0, cucumber_1.Then)('{word} model function is found', function (modelFunctionKey) {
    chai_1.assert.isFunction(this.model.methods[modelFunctionKey]);
});
//# sourceMappingURL=oldSteps.js.map