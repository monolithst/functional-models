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
exports.createPropertyTitle = exports.BooleanProperty = exports.EmailProperty = exports.ObjectProperty = exports.NumberProperty = exports.ConstantValueProperty = exports.TextProperty = exports.IntegerProperty = exports.ReferenceProperty = exports.ArrayProperty = exports.DateProperty = exports.UniqueId = exports.Property = void 0;
const identity_1 = __importDefault(require("lodash/identity"));
const get_1 = __importDefault(require("lodash/get"));
const isFunction_1 = __importDefault(require("lodash/isFunction"));
const merge_1 = __importDefault(require("lodash/merge"));
const validation_1 = require("./validation");
const constants_1 = require("./constants");
const lazy_1 = require("./lazy");
const utils_1 = require("./utils");
const createPropertyTitle = (key) => {
    const goodName = (0, utils_1.toTitleCase)(key);
    return `get${goodName}`;
};
exports.createPropertyTitle = createPropertyTitle;
const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u;
function _getValidatorFromConfigElseEmpty(input, 
// eslint-disable-next-line no-unused-vars
validatorGetter) {
    if (input !== undefined) {
        const validator = validatorGetter(input);
        return validator;
    }
    return validation_1.emptyValidator;
}
const _mergeValidators = (config, validators) => {
    return [...validators, ...((config === null || config === void 0 ? void 0 : config.validators) ? config.validators : [])];
};
const Property = (type, config, additionalMetadata = {}) => {
    if (!type && !config.type) {
        throw new Error(`Property type must be provided.`);
    }
    if (config.type) {
        type = config.type;
    }
    const getConstantValue = () => config.value !== undefined ? config.value : undefined;
    const getDefaultValue = () => config.defaultValue !== undefined ? config.defaultValue : undefined;
    const getChoices = () => config.choices ? config.choices : [];
    const lazyLoadMethod = config.lazyLoadMethod || false;
    const valueSelector = config.valueSelector || identity_1.default;
    if (typeof valueSelector !== 'function') {
        throw new Error(`valueSelector must be a function`);
    }
    return Object.assign(Object.assign({}, additionalMetadata), { getConfig: () => config, getChoices,
        getDefaultValue,
        getConstantValue, getPropertyType: () => type, createGetter: instanceValue => {
            const value = getConstantValue();
            if (value !== undefined) {
                return () => value;
            }
            const defaultValue = getDefaultValue();
            if (defaultValue !== undefined &&
                (instanceValue === null || instanceValue === undefined)) {
                return () => defaultValue;
            }
            const method = lazyLoadMethod
                ? (0, lazy_1.lazyValue)(lazyLoadMethod)
                : typeof instanceValue === 'function'
                    ? instanceValue
                    : () => instanceValue;
            return () => __awaiter(void 0, void 0, void 0, function* () {
                return valueSelector(yield method(instanceValue));
            });
        }, getValidator: valueGetter => {
            const validator = (0, validation_1.createPropertyValidator)(config);
            const _propertyValidatorWrapper = (instance, instanceData, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
                return validator(yield valueGetter(), instance, instanceData, options);
            });
            return _propertyValidatorWrapper;
        } });
};
exports.Property = Property;
const DateProperty = (config, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.DateProperty, Object.assign(Object.assign({}, config), { lazyLoadMethod: value => {
        if (!value && (config === null || config === void 0 ? void 0 : config.autoNow)) {
            return new Date();
        }
        return value;
    } }), additionalMetadata);
exports.DateProperty = DateProperty;
const ReferenceProperty = (model, config = {}, additionalMetadata = {}) => {
    if (!model) {
        throw new Error('Must include the referenced model');
    }
    const _getModel = () => {
        if ((0, isFunction_1.default)(model)) {
            return model();
        }
        return model;
    };
    const validators = _mergeValidators(config, [(0, validation_1.referenceTypeMatch)(model)]);
    const _getId = (instanceValues) => () => {
        if (!instanceValues) {
            return null;
        }
        const theModel = _getModel();
        const primaryKey = theModel.getPrimaryKeyName();
        if (instanceValues[primaryKey]) {
            return instanceValues[primaryKey];
        }
        const primaryKeyFunc = (0, get_1.default)(instanceValues, 'functions.getPrimaryKey');
        if (primaryKeyFunc) {
            return primaryKeyFunc();
        }
        return instanceValues;
    };
    const lazyLoadMethod = (instanceValues) => __awaiter(void 0, void 0, void 0, function* () {
        const valueIsModelInstance = Boolean(instanceValues) && Boolean(instanceValues.functions);
        const _getInstanceReturn = objToUse => {
            // We need to determine if the object we just go is an actual model instance to determine if we need to make one.
            const objIsModelInstance = Boolean(objToUse) && Boolean(objToUse.functions);
            const instance = objIsModelInstance
                ? objToUse
                : _getModel().create(objToUse);
            return (0, merge_1.default)({}, instance, {
                functions: {
                    toObj: _getId(instanceValues),
                },
            });
        };
        if (valueIsModelInstance) {
            return _getInstanceReturn(instanceValues);
        }
        if (config.fetcher) {
            const id = yield _getId(instanceValues)();
            const model = _getModel();
            const obj = yield config.fetcher(model, id);
            return _getInstanceReturn(obj);
        }
        return _getId(instanceValues)();
    });
    return Property(constants_1.PROPERTY_TYPES.ReferenceProperty, (0, merge_1.default)({}, config, {
        validators,
        lazyLoadMethod,
    }), Object.assign(Object.assign({}, additionalMetadata), { meta: {
            getReferencedId: (instanceValues) => _getId(instanceValues)(),
            getReferencedModel: _getModel,
        } }));
};
exports.ReferenceProperty = ReferenceProperty;
const ArrayProperty = (config = {}, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.ArrayProperty, Object.assign(Object.assign({ defaultValue: [] }, config), { isArray: true }), additionalMetadata);
exports.ArrayProperty = ArrayProperty;
const ObjectProperty = (config = {}, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.ObjectProperty, (0, merge_1.default)(config, {
    validators: _mergeValidators(config, [(0, validation_1.isType)('object')]),
}), additionalMetadata);
exports.ObjectProperty = ObjectProperty;
const TextProperty = (config = {}, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.TextProperty, (0, merge_1.default)(config, {
    isString: true,
    validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config, 'maxLength', value => (0, validation_1.maxTextLength)(value)),
        _getValidatorFromConfigElseEmpty(config, 'minLength', value => (0, validation_1.minTextLength)(value)),
    ]),
}), additionalMetadata);
exports.TextProperty = TextProperty;
const IntegerProperty = (config = {}, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.IntegerProperty, (0, merge_1.default)(config, {
    isInteger: true,
    validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config, 'minValue', value => (0, validation_1.minNumber)(value)),
        _getValidatorFromConfigElseEmpty(config, 'maxValue', value => (0, validation_1.maxNumber)(value)),
    ]),
}), additionalMetadata);
exports.IntegerProperty = IntegerProperty;
const NumberProperty = (config, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.NumberProperty, (0, merge_1.default)(config, {
    isNumber: true,
    validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config === null || config === void 0 ? void 0 : config.minValue, value => (0, validation_1.minNumber)(value)),
        _getValidatorFromConfigElseEmpty(config === null || config === void 0 ? void 0 : config.maxValue, value => (0, validation_1.maxNumber)(value)),
    ]),
}), additionalMetadata);
exports.NumberProperty = NumberProperty;
const ConstantValueProperty = (value, config, additionalMetadata = {}) => TextProperty((0, merge_1.default)(config, {
    type: constants_1.PROPERTY_TYPES.ConstantValueProperty,
    value,
}), additionalMetadata);
exports.ConstantValueProperty = ConstantValueProperty;
const EmailProperty = (config, additionalMetadata = {}) => TextProperty((0, merge_1.default)(config, {
    type: constants_1.PROPERTY_TYPES.EmailProperty,
    validators: _mergeValidators(config, [(0, validation_1.meetsRegex)(EMAIL_REGEX)]),
}), additionalMetadata);
exports.EmailProperty = EmailProperty;
const BooleanProperty = (config, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.BooleanProperty, (0, merge_1.default)(config, {
    isBoolean: true,
    validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config === null || config === void 0 ? void 0 : config.minValue, value => (0, validation_1.minNumber)(value)),
        _getValidatorFromConfigElseEmpty(config === null || config === void 0 ? void 0 : config.maxValue, value => (0, validation_1.maxNumber)(value)),
    ]),
}), additionalMetadata);
exports.BooleanProperty = BooleanProperty;
const UniqueId = (config, additionalMetadata = {}) => Property(constants_1.PROPERTY_TYPES.UniqueId, Object.assign(Object.assign({}, config), { lazyLoadMethod: value => {
        if (!value) {
            return (0, utils_1.createUuid)();
        }
        return value;
    } }), additionalMetadata);
exports.UniqueId = UniqueId;
