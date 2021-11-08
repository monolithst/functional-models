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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPE_PRIMATIVES = exports.multiplePropertiesMustMatch = exports.referenceTypeMatch = exports.arrayType = exports.createModelValidator = exports.createPropertyValidator = exports.emptyValidator = exports.aggregateValidator = exports.meetsRegex = exports.minTextLength = exports.maxTextLength = exports.choices = exports.minNumber = exports.maxNumber = exports.isRequired = exports.isArray = exports.isDate = exports.isType = exports.isInteger = exports.isString = exports.isBoolean = exports.isNumber = void 0;
var isEmpty_1 = __importDefault(require("lodash/isEmpty"));
var merge_1 = __importDefault(require("lodash/merge"));
var isFunction_1 = __importDefault(require("lodash/isFunction"));
var flatMap_1 = __importDefault(require("lodash/flatMap"));
var get_1 = __importDefault(require("lodash/get"));
var TYPE_PRIMATIVES = {
    boolean: 'boolean',
    string: 'string',
    object: 'object',
    number: 'number',
    integer: 'integer',
};
exports.TYPE_PRIMATIVES = TYPE_PRIMATIVES;
var _trueOrError = function (method, error) { return function (value) {
    if (method(value) === false) {
        return error;
    }
    return undefined;
}; };
var _typeOrError = function (type, errorMessage) { return function (value) {
    if (typeof value !== type) {
        return errorMessage;
    }
    return undefined;
}; };
var isType = function (type) { return function (value) {
    // @ts-ignore
    return _typeOrError(type, "Must be a " + type)(value);
}; };
exports.isType = isType;
var isNumber = isType('number');
exports.isNumber = isNumber;
var isInteger = _trueOrError(Number.isInteger, 'Must be an integer');
exports.isInteger = isInteger;
var isBoolean = isType('boolean');
exports.isBoolean = isBoolean;
var isString = isType('string');
exports.isString = isString;
var isArray = _trueOrError(function (v) { return Array.isArray(v); }, 'Value is not an array');
exports.isArray = isArray;
var PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR = (_a = {},
    _a[TYPE_PRIMATIVES.boolean] = isBoolean,
    _a[TYPE_PRIMATIVES.string] = isString,
    _a[TYPE_PRIMATIVES.integer] = isInteger,
    _a[TYPE_PRIMATIVES.number] = isNumber,
    _a);
var arrayType = function (type) { return function (value) {
    // @ts-ignore
    var arrayError = isArray(value);
    if (arrayError) {
        return arrayError;
    }
    var validator = PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR[type] || isType(type);
    return value.reduce(function (acc, v) {
        if (acc) {
            return acc;
        }
        // @ts-ignore
        return validator(v);
    }, undefined);
}; };
exports.arrayType = arrayType;
var multiplePropertiesMustMatch = function (getKeyA, getKeyB, errorMessage) {
    if (errorMessage === void 0) { errorMessage = 'Properties do not match'; }
    return function (_, instance) { return __awaiter(void 0, void 0, void 0, function () {
        var keyA, keyB;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getKeyA(instance)];
                case 1:
                    keyA = _a.sent();
                    return [4 /*yield*/, getKeyB(instance)];
                case 2:
                    keyB = _a.sent();
                    if (keyA !== keyB) {
                        return [2 /*return*/, errorMessage];
                    }
                    return [2 /*return*/, undefined];
            }
        });
    }); };
};
exports.multiplePropertiesMustMatch = multiplePropertiesMustMatch;
var meetsRegex = function (regex, flags, errorMessage) {
    if (errorMessage === void 0) { errorMessage = 'Format was invalid'; }
    return function (value) {
        var reg = new RegExp(regex, flags);
        // @ts-ignore
        return _trueOrError(function (v) { return reg.test(v); }, errorMessage)(value);
    };
};
exports.meetsRegex = meetsRegex;
var choices = function (choiceArray) { return function (value) {
    if (Array.isArray(value)) {
        var bad = value.find(function (v) { return !choiceArray.includes(v); });
        if (bad) {
            return bad + " is not a valid choice";
        }
    }
    else {
        if (!choiceArray.includes(String(value))) {
            return value + " is not a valid choice";
        }
    }
    return undefined;
}; };
exports.choices = choices;
var isDate = function (value) {
    if (!value) {
        return 'Date value is empty';
    }
    if (!value.toISOString) {
        return 'Value is not a date';
    }
    return undefined;
};
exports.isDate = isDate;
var isRequired = function (value) {
    if (value === true || value === false) {
        return undefined;
    }
    // @ts-ignore
    if (isNumber(value) === undefined) {
        return undefined;
    }
    var empty = (0, isEmpty_1.default)(value);
    if (empty) {
        // @ts-ignore
        if (isDate(value)) {
            return 'A value is required';
        }
    }
    return undefined;
};
exports.isRequired = isRequired;
var maxNumber = function (max) { return function (value) {
    // @ts-ignore
    var numberError = isNumber(value);
    if (numberError) {
        return numberError;
    }
    if (value && (value > max)) {
        return "The maximum is " + max;
    }
    return undefined;
}; };
exports.maxNumber = maxNumber;
var minNumber = function (min) { return function (value) {
    // @ts-ignore
    var numberError = isNumber(value);
    if (numberError) {
        return numberError;
    }
    if (value && (value < min)) {
        return "The minimum is " + min;
    }
    return undefined;
}; };
exports.minNumber = minNumber;
var maxTextLength = function (max) { return function (value) {
    // @ts-ignore
    var stringError = isString(value);
    if (stringError) {
        return stringError;
    }
    if (value && (value.length > max)) {
        return "The maximum length is " + max;
    }
    return undefined;
}; };
exports.maxTextLength = maxTextLength;
var minTextLength = function (min) { return function (value) {
    // @ts-ignore
    var stringError = isString(value);
    if (stringError) {
        return stringError;
    }
    if (value && (value.length < min)) {
        return "The minimum length is " + min;
    }
    return undefined;
}; };
exports.minTextLength = minTextLength;
var referenceTypeMatch = function (referencedModel) {
    return function (value) {
        if (!value) {
            return 'Must include a value';
        }
        // This needs to stay here, as it delays the creation long enough for
        // self referencing types.
        var model = (0, isFunction_1.default)(referencedModel)
            ? referencedModel()
            : referencedModel;
        // Assumption: By the time this is received, value === a model instance.
        var eModel = model.getName();
        var aModel = value.meta.getModel().getName();
        if (eModel !== aModel) {
            return "Model should be " + eModel + " instead, received " + aModel;
        }
        return undefined;
    };
};
exports.referenceTypeMatch = referenceTypeMatch;
var aggregateValidator = function (methodOrMethods) {
    var toDo = Array.isArray(methodOrMethods)
        ? methodOrMethods
        : [methodOrMethods];
    var _aggregativeValidator = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(void 0, void 0, void 0, function () {
            var values;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(toDo.map(function (method) {
                            return method.apply(void 0, args);
                        }))];
                    case 1:
                        values = _a.sent();
                        return [2 /*return*/, values.filter(function (x) { return x; })];
                }
            });
        });
    };
    return _aggregativeValidator;
};
exports.aggregateValidator = aggregateValidator;
var emptyValidator = function () { return []; };
exports.emptyValidator = emptyValidator;
var _boolChoice = function (method) { return function (value) {
    return value ? method : undefined;
}; };
var CONFIG_TO_VALIDATE_METHOD = {
    required: _boolChoice(isRequired),
    isInteger: _boolChoice(isInteger),
    isNumber: _boolChoice(isNumber),
    isString: _boolChoice(isString),
    isArray: _boolChoice(isArray),
    isBoolean: _boolChoice(isBoolean),
    choices: choices,
};
var createPropertyValidator = function (config) {
    var validators = __spreadArray(__spreadArray([], Object.entries(config).map(function (_a) {
        var key = _a[0], value = _a[1];
        return (CONFIG_TO_VALIDATE_METHOD[key] || (function () { return undefined; }))(value);
    }), true), (config.validators ? config.validators : []), true).filter(function (x) { return x; });
    var isRequiredValue = config.required
        ? true
        : validators.includes(isRequired);
    var validator = validators.length > 0 ? aggregateValidator(validators) : emptyValidator;
    var _propertyValidator = function (value, instance, instanceData, options) {
        if (instanceData === void 0) { instanceData = {}; }
        return __awaiter(void 0, void 0, void 0, function () {
            var errors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!value && !isRequiredValue) {
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, validator(value, instance, instanceData, options)];
                    case 1:
                        errors = _a.sent();
                        return [2 /*return*/, __spreadArray([], new Set((0, flatMap_1.default)(errors)), true)];
                }
            });
        });
    };
    return _propertyValidator;
};
exports.createPropertyValidator = createPropertyValidator;
var createModelValidator = function (properties, modelValidators) {
    if (modelValidators === void 0) { modelValidators = []; }
    var _modelValidator = function (instance, options) { return __awaiter(void 0, void 0, void 0, function () {
        var keysAndFunctions, instanceData, propertyValidationErrors, modelValidationErrors, propertyErrors;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!instance) {
                        throw new Error("Instance cannot be empty");
                    }
                    keysAndFunctions = Object.entries((0, get_1.default)(properties, 'functions.validators', {}));
                    return [4 /*yield*/, instance.functions.toObj()];
                case 1:
                    instanceData = _a.sent();
                    return [4 /*yield*/, Promise.all(keysAndFunctions.map(function (_a) {
                            var key = _a[0], validator = _a[1];
                            return __awaiter(void 0, void 0, void 0, function () {
                                var _b;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _b = [key];
                                            return [4 /*yield*/, validator(instance, instanceData, options)];
                                        case 1: return [2 /*return*/, _b.concat([_c.sent()])];
                                    }
                                });
                            });
                        }))];
                case 2:
                    propertyValidationErrors = _a.sent();
                    return [4 /*yield*/, Promise.all(modelValidators.map(function (validator) { return validator(instance, instanceData, options); }))];
                case 3:
                    modelValidationErrors = (_a.sent()).filter(function (x) { return x; });
                    propertyErrors = propertyValidationErrors
                        .filter(function (_a) {
                        var _ = _a[0], errors = _a[1];
                        return Boolean(errors) && errors.length > 0;
                    })
                        .reduce(function (acc, _a) {
                        var _b;
                        var key = _a[0], errors = _a[1];
                        return __assign(__assign({}, acc), (_b = {}, _b[key] = errors, _b));
                    }, {});
                    return [2 /*return*/, modelValidationErrors.length > 0
                            ? (0, merge_1.default)(propertyErrors, { overall: modelValidationErrors })
                            : propertyErrors];
            }
        });
    }); };
    return _modelValidator;
};
exports.createModelValidator = createModelValidator;
