"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const merge_1 = __importDefault(require("lodash/merge"));
const get_1 = __importDefault(require("lodash/get"));
const serialization_1 = require("./serialization");
const validation_1 = require("./validation");
const properties_1 = require("./properties");
const MODEL_DEF_KEYS = ['meta', 'functions'];
function x(input) {
    return T;
}
const Model2 = {
    getName: () => 'blah',
    create: (data) => {
        return {
            functions: {
                toObj: () => Promise.resolve(),
                getPrimaryKey: () => Promise.resolve(1),
                validators: {},
            },
            meta: {
                getModel: () => Model2
            },
        };
    }
};
const y = x(Model2);
const Model = (modelName, keyToProperty, { primaryKey = 'id', getPrimaryKeyProperty = () => (0, properties_1.UniqueId)({ required: true }), instanceCreatedCallback = null, modelFunctions = {}, instanceFunctions = {}, modelValidators = [], } = {}) => {
    /*
     * This non-functional approach is specifically used to
     * allow instances to be able to refer back to its parent without
     * having to duplicate it for every instance.
     * This is set at the very end and returned, so it can be referenced
     * throughout instance methods.
     */
    // eslint-disable-next-line functional/no-let
    let model = null;
    keyToProperty = Object.assign({ 
        // this key exists over keyToProperty, so it can be overrided if desired.
        [primaryKey]: getPrimaryKeyProperty() }, keyToProperty);
    const instanceProperties = Object.entries(keyToProperty).filter(([key, _]) => MODEL_DEF_KEYS.includes(key) === false);
    const specialProperties1 = Object.entries(keyToProperty).filter(([key, _]) => MODEL_DEF_KEYS.includes(key));
    const properties = instanceProperties.reduce((acc, [key, property]) => {
        return (0, merge_1.default)(acc, { [key]: property });
    }, {});
    const specialProperties = specialProperties1.reduce((acc, [key, property]) => {
        return (0, merge_1.default)(acc, { [key]: property });
    }, {});
    const create = (instanceValues = {}) => {
        // eslint-disable-next-line functional/no-let
        let instance = null;
        const specialInstanceProperties1 = MODEL_DEF_KEYS.reduce((acc, key) => {
            if (key in instanceValues) {
                return Object.assign(Object.assign({}, acc), { [key]: instanceValues[key] });
            }
            return acc;
        }, {});
        const loadedInternals = instanceProperties.reduce((acc, [key, property]) => {
            const propertyGetter = property.createGetter(instanceValues[key]);
            const propertyValidator = property.getValidator(propertyGetter);
            const getPropertyKey = (0, properties_1.createPropertyTitle)(key);
            const fleshedOutInstanceProperties = {
                [getPropertyKey]: propertyGetter,
                functions: {
                    getters: {
                        [key]: propertyGetter,
                    },
                    validators: {
                        [key]: propertyValidator,
                    },
                },
            };
            const referenceProperties = (0, get_1.default)(property, 'meta.getReferencedId')
                ? {
                    meta: {
                        references: {
                            [(0, properties_1.createPropertyTitle)(`${key}Id`)]: () => property.meta.getReferencedId(instanceValues[key])
                        }
                    }
                }
                : {};
            return (0, merge_1.default)(acc, fleshedOutInstanceProperties, referenceProperties);
        }, {});
        const frameworkProperties = {
            meta: {
                getModel: () => model,
            },
            functions: {
                toObj: (0, serialization_1.toObj)(loadedInternals),
                getPrimaryKey: loadedInternals[(0, properties_1.createPropertyTitle)(primaryKey)],
                validate: (options = {}) => {
                    return (0, validation_1.createModelValidator)(loadedInternals, modelValidators)(instance, options);
                },
            },
        };
        const fleshedOutInstanceFunctions = Object.entries(instanceFunctions).reduce((acc, [key, func]) => {
            return (0, merge_1.default)(acc, {
                functions: {
                    [key]: (...args) => {
                        return func(...args, instance);
                    },
                },
            });
        }, {});
        instance = (0, merge_1.default)({}, loadedInternals, specialProperties, fleshedOutInstanceFunctions, frameworkProperties, specialInstanceProperties1);
        if (instanceCreatedCallback) {
            instanceCreatedCallback(instance);
        }
        return instance;
    };
    const fleshedOutModelFunctions = Object.entries(modelFunctions).reduce((acc, [key, func]) => {
        return (0, merge_1.default)(acc, {
            [key]: (...args) => {
                return func(model)(...args);
            },
        });
    }, {});
    // This sets the model that is used by the instances later.
    model = (0, merge_1.default)({}, fleshedOutModelFunctions, {
        create,
        getName: () => modelName,
        getProperties: () => properties,
        getPrimaryKeyName: () => primaryKey,
    });
    return model;
};
module.exports = {
    Model,
};
