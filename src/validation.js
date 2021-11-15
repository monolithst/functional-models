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
exports.TYPE_PRIMATIVES = exports.multiplePropertiesMustMatch = exports.referenceTypeMatch = exports.arrayType = exports.createModelValidator = exports.createPropertyValidator = exports.emptyValidator = exports.aggregateValidator = exports.meetsRegex = exports.minTextLength = exports.maxTextLength = exports.choices = exports.minNumber = exports.maxNumber = exports.isRequired = exports.isArray = exports.isDate = exports.isType = exports.isInteger = exports.isString = exports.isBoolean = exports.isNumber = void 0;
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const merge_1 = __importDefault(require("lodash/merge"));
const flatMap_1 = __importDefault(require("lodash/flatMap"));
const TYPE_PRIMATIVES = {
    boolean: 'boolean',
    string: 'string',
    object: 'object',
    number: 'number',
    integer: 'integer',
};
exports.TYPE_PRIMATIVES = TYPE_PRIMATIVES;
function filterEmpty(array) {
    let array2 = [];
    for (const i in array) {
        const item = array[i];
        if (item === undefined)
            continue;
        if (item === null)
            continue;
        // @ts-ignore
        array2.push(array[i]);
    }
    return array2;
}
const notEmpty = (value) => {
    if (value === null || value === undefined)
        return false;
    const testDummy = value;
    return true;
};
const _trueOrError = (method, error) => (value) => {
    if (method(value) === false) {
        return error;
    }
    return undefined;
};
const _typeOrError = (type, errorMessage) => (value) => {
    if (typeof value !== type) {
        return errorMessage;
    }
    return undefined;
};
const isType = (type) => (value) => {
    // @ts-ignore
    return _typeOrError(type, `Must be a ${type}`)(value);
};
exports.isType = isType;
const isNumber = isType('number');
exports.isNumber = isNumber;
const isInteger = _trueOrError(Number.isInteger, 'Must be an integer');
exports.isInteger = isInteger;
const isBoolean = isType('boolean');
exports.isBoolean = isBoolean;
const isString = isType('string');
exports.isString = isString;
const isArray = _trueOrError((v) => Array.isArray(v), 'Value is not an array');
exports.isArray = isArray;
const PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR = {
    [TYPE_PRIMATIVES.boolean]: isBoolean,
    [TYPE_PRIMATIVES.string]: isString,
    [TYPE_PRIMATIVES.integer]: isInteger,
    [TYPE_PRIMATIVES.number]: isNumber,
};
const arrayType = (type) => (value) => {
    // @ts-ignore
    const arrayError = isArray(value);
    if (arrayError) {
        return arrayError;
    }
    const validator = PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR[type] || isType(type);
    return value.reduce((acc, v) => {
        if (acc) {
            return acc;
        }
        // @ts-ignore
        return validator(v);
    }, undefined);
};
exports.arrayType = arrayType;
const multiplePropertiesMustMatch = (getKeyA, getKeyB, errorMessage = 'Properties do not match') => (_, instance) => __awaiter(void 0, void 0, void 0, function* () {
    const keyA = yield getKeyA(instance);
    const keyB = yield getKeyB(instance);
    if (keyA !== keyB) {
        return errorMessage;
    }
    return undefined;
});
exports.multiplePropertiesMustMatch = multiplePropertiesMustMatch;
const meetsRegex = (regex, flags, errorMessage = 'Format was invalid') => (value) => {
    const reg = new RegExp(regex, flags);
    // @ts-ignore
    return _trueOrError((v) => reg.test(v), errorMessage)(value);
};
exports.meetsRegex = meetsRegex;
const choices = (choiceArray) => (value) => {
    if (Array.isArray(value)) {
        const bad = value.find(v => !choiceArray.includes(String(v)));
        if (bad) {
            return `${bad} is not a valid choice`;
        }
    }
    else {
        if (!choiceArray.includes(String(value))) {
            return `${value} is not a valid choice`;
        }
    }
    return undefined;
};
exports.choices = choices;
const isDate = (value) => {
    if (!value) {
        return 'Date value is empty';
    }
    if (!value.toISOString) {
        return 'Value is not a date';
    }
    return undefined;
};
exports.isDate = isDate;
const isRequired = (value) => {
    if (value === true || value === false) {
        return undefined;
    }
    // @ts-ignore
    if (isNumber(value) === undefined) {
        return undefined;
    }
    const empty = (0, isEmpty_1.default)(value);
    if (empty) {
        // @ts-ignore
        if (isDate(value)) {
            return 'A value is required';
        }
    }
    return undefined;
};
exports.isRequired = isRequired;
const maxNumber = (max) => (value) => {
    // @ts-ignore
    const numberError = isNumber(value);
    if (numberError) {
        return numberError;
    }
    if (value && (value > max)) {
        return `The maximum is ${max}`;
    }
    return undefined;
};
exports.maxNumber = maxNumber;
const minNumber = (min) => (value) => {
    // @ts-ignore
    const numberError = isNumber(value);
    if (numberError) {
        return numberError;
    }
    if (value && (value < min)) {
        return `The minimum is ${min}`;
    }
    return undefined;
};
exports.minNumber = minNumber;
const maxTextLength = (max) => (value) => {
    // @ts-ignore
    const stringError = isString(value);
    if (stringError) {
        return stringError;
    }
    if (value && (value.length > max)) {
        return `The maximum length is ${max}`;
    }
    return undefined;
};
exports.maxTextLength = maxTextLength;
const minTextLength = (min) => (value) => {
    // @ts-ignore
    const stringError = isString(value);
    if (stringError) {
        return stringError;
    }
    if (value && (value.length < min)) {
        return `The minimum length is ${min}`;
    }
    return undefined;
};
exports.minTextLength = minTextLength;
const referenceTypeMatch = (referencedModel) => {
    return (value) => {
        if (!value) {
            return 'Must include a value';
        }
        // This needs to stay here, as it delays the creation long enough for
        // self referencing types.
        const model = typeof referencedModel === 'function'
            ? referencedModel()
            : referencedModel;
        // Assumption: By the time this is received, value === a model instance.
        const eModel = model.getName();
        const aModel = value.getModel().getName();
        if (eModel !== aModel) {
            return `Model should be ${eModel} instead, received ${aModel}`;
        }
        return undefined;
    };
};
exports.referenceTypeMatch = referenceTypeMatch;
const aggregateValidator = (value, methodOrMethods) => {
    const toDo = Array.isArray(methodOrMethods)
        ? methodOrMethods
        : [methodOrMethods];
    const _aggregativeValidator = (instance, data) => __awaiter(void 0, void 0, void 0, function* () {
        const values = yield Promise.all(toDo.map(method => {
            return method(value, instance, data);
        }));
        return filterEmpty(values);
    });
    return _aggregativeValidator;
};
exports.aggregateValidator = aggregateValidator;
const emptyValidator = () => undefined;
exports.emptyValidator = emptyValidator;
const _boolChoice = (method) => (configValue) => {
    const func = configValue ? method(configValue) : undefined;
    const validatorWrapper = (value, modelInstance, modelData) => {
        if (!func) {
            return undefined;
        }
        return func(value, modelInstance, modelData);
    };
    return validatorWrapper;
};
const simpleFuncWrap = (validator) => () => {
    return validator;
};
const CONFIG_TO_VALIDATE_METHOD = {
    required: _boolChoice(simpleFuncWrap(isRequired)),
    isInteger: _boolChoice(simpleFuncWrap(isInteger)),
    isNumber: _boolChoice(simpleFuncWrap(isNumber)),
    isString: _boolChoice(simpleFuncWrap(isString)),
    isArray: _boolChoice(simpleFuncWrap(isArray)),
    isBoolean: _boolChoice(simpleFuncWrap(isBoolean)),
    choices: _boolChoice(choices),
};
const createPropertyValidator = (valueGetter, config) => {
    const _propertyValidator = (instance, instanceData = {}, options) => __awaiter(void 0, void 0, void 0, function* () {
        const validators = [
            ...Object.entries(config).map(([key, value]) => {
                const method = CONFIG_TO_VALIDATE_METHOD[key];
                if (method) {
                    const validator = method(value);
                    if (validator === undefined) {
                        return emptyValidator;
                    }
                    return validator;
                }
                return emptyValidator;
            }),
            ...((config === null || config === void 0 ? void 0 : config.validators) ? config.validators : []),
        ].filter(x => x);
        const value = yield valueGetter();
        const isRequiredValue = (config === null || config === void 0 ? void 0 : config.required)
            ? true
            : validators.includes(isRequired);
        if (!value && !isRequiredValue) {
            return [];
        }
        const validator = aggregateValidator(value, validators);
        const errors = yield validator(instance, instanceData);
        return [...new Set((0, flatMap_1.default)(errors))];
    });
    return _propertyValidator;
};
exports.createPropertyValidator = createPropertyValidator;
const createModelValidator = (validators, modelValidators) => {
    const _modelValidator = (instance, options) => __awaiter(void 0, void 0, void 0, function* () {
        if (!instance) {
            throw new Error(`Instance cannot be empty`);
        }
        const keysAndFunctions = Object.entries(validators);
        const instanceData = yield instance.toObj();
        const propertyValidationErrors = yield Promise.all(keysAndFunctions.map(([key, validator]) => __awaiter(void 0, void 0, void 0, function* () {
            return [key, yield validator(instance, instanceData, options)];
        })));
        const modelValidationErrors = (yield Promise.all(modelValidators ? modelValidators.map(validator => validator(instance, instanceData, options)) : [])).filter(x => x);
        const propertyErrors = propertyValidationErrors
            .filter(([_, errors]) => Boolean(errors) && errors.length > 0)
            .reduce((acc, [key, errors]) => {
            return Object.assign(Object.assign({}, acc), { [String(key)]: errors });
        }, {});
        return modelValidationErrors.length > 0
            ? (0, merge_1.default)(propertyErrors, { overall: modelValidationErrors })
            : propertyErrors;
    });
    return _modelValidator;
};
exports.createModelValidator = createModelValidator;
