"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const merge_1 = __importDefault(require("lodash/merge"));
const serialization_1 = require("./serialization");
const validation_1 = require("./validation");
const properties_1 = require("./properties");
const MODEL_DEF_KEYS = ['meta', 'functions'];
/*
const createModel = () : IModel<{
  name: string,
}> => ({
  getName: () => '',
  getPrimaryKeyName: () => '',
  getPrimaryKey: (t: {}) => '',
  create: (data) => ({
    get: {
      name: () => Promise.resolve(data.name)
    },
    functions: {
      toObj: () => Promise.resolve({}),
      getPrimaryKey: () => '',
      validators: {
      },
    },
    meta: {
      getModel: () => createModel()
    },
  })
})


const modelGetter = (model: IModel<{text: string}>, key: string) => {
  const m = model.create({ text: 'hello' })
  const t = m.get.text()

  return Promise.resolve({})
}

const myconfig : IPropertyConfig = {
  fetcher: modelGetter,
}
 */
const _defaultOptions = () => ({
    primaryKey: 'id',
    getPrimaryKeyProperty: () => (0, properties_1.UniqueId)({ required: true }),
    instanceCreatedCallback: null,
    modelFunctions: {},
    instanceFunctions: {},
    modelValidators: [],
});
const _convertOptions = (options) => {
    const r = (0, merge_1.default)({}, _defaultOptions(), options);
    return r;
};
const Model = (modelName, keyToProperty, 
//keyToProperty: IModelDefinition2<T>,
options) => {
    /*
     * This non-functional approach is specifically used to
     * allow instances to be able to refer back to its parent without
     * having to duplicate it for every instance.
     * This is set at the very end and returned, so it can be referenced
     * throughout instance methods.
     */
    // eslint-disable-next-line functional/no-let
    let model = null;
    const theOptions = _convertOptions(options);
    keyToProperty = Object.assign({ 
        // this key exists over keyToProperty, so it can be overrided if desired.
        // This is BEFORE, because the ... overrides this.
        [theOptions.primaryKey]: theOptions.getPrimaryKeyProperty() }, keyToProperty);
    const instanceProperties = Object.entries(keyToProperty).filter(([key, _]) => !MODEL_DEF_KEYS.includes(key));
    const specialProperties1 = Object.entries(keyToProperty).filter(([key, _]) => MODEL_DEF_KEYS.includes(key));
    const properties = instanceProperties.reduce((acc, [key, property]) => {
        return (0, merge_1.default)(acc, { [key]: property });
    }, {});
    const specialProperties = specialProperties1.reduce((acc, [key, property]) => {
        return (0, merge_1.default)(acc, { [key]: property });
    }, {});
    const create = (instanceValues) => {
        // eslint-disable-next-line functional/no-let
        let instance = null;
        const specialInstanceProperties1 = MODEL_DEF_KEYS.reduce((acc, key) => {
            if (key in instanceValues) {
                return Object.assign(Object.assign({}, acc), { [key]: instanceValues[key] });
            }
            return acc;
        }, {});
        const startingInternals = { get: {}, validators: {}, references: {} };
        const loadedInternals = instanceProperties.reduce((acc, [key, property]) => {
            // @ts-ignore
            const propertyGetter = property.createGetter(instanceValues[key]);
            const propertyValidator = property.getValidator(propertyGetter);
            const fleshedOutInstanceProperties = {
                get: {
                    [key]: propertyGetter,
                },
                validators: {
                    [key]: propertyValidator,
                },
            };
            const asReferenced = property;
            const referencedProperty = asReferenced
                ? {
                    references: {
                        [key]: () => asReferenced.getReferencedId(instanceValues[key])
                    }
                }
                : {};
            return (0, merge_1.default)(acc, fleshedOutInstanceProperties, referencedProperty);
        }, startingInternals);
        // @ts-ignore
        const frameworkProperties = {
            getModel: () => model,
            toObj: (0, serialization_1.toObj)(loadedInternals.get),
            // @ts-ignore
            getPrimaryKey: () => instance === null || instance === void 0 ? void 0 : instance.get[theOptions.primaryKey](),
            validate: (options = {}) => {
                return (0, validation_1.createModelValidator)(loadedInternals.validators, theOptions.modelValidators)(instance, options);
            },
        };
        const fleshedOutInstanceFunctions = Object.entries(theOptions.instanceFunctions).reduce((acc, [key, func]) => {
            return (0, merge_1.default)(acc, {
                [key]: (...args) => {
                    return func(instance, ...args);
                },
            });
        }, {});
        instance = (0, merge_1.default)({}, loadedInternals, specialProperties, fleshedOutInstanceFunctions, frameworkProperties, specialInstanceProperties1);
        if (theOptions.instanceCreatedCallback) {
            if (Array.isArray(theOptions.instanceCreatedCallback)) {
                theOptions.instanceCreatedCallback.forEach(func => func(instance));
            }
        }
        return instance;
    };
    const fleshedOutModelFunctions = Object.entries(theOptions.modelFunctions).reduce((acc, [key, func]) => {
        return (0, merge_1.default)(acc, {
            [key]: (...args) => {
                return func(model, ...args);
            },
        });
    }, {});
    // This sets the model that is used by the instances later.
    model = (0, merge_1.default)(fleshedOutModelFunctions, {
        create,
        getName: () => modelName,
        getModelDefinition: () => properties,
        getPrimaryKeyName: () => theOptions.primaryKey,
        getPrimaryKey: (t) => t[theOptions.primaryKey],
    });
    return model;
};
exports.Model = Model;
