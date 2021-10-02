const merge = require('lodash/merge')
const { toObj } = require('./serialization')
const { createPropertyTitle } = require('./utils')
const { createModelValidator } = require('./validation')

const MODEL_DEF_KEYS = ['meta', 'functions']
const PROTECTED_KEYS = ['model']

const Model = (
  modelName,
  keyToProperty,
  {
    instanceCreatedCallback = null,
    modelFunctions = {},
    instanceFunctions = {},
  } = {}
) => {
  /*
   * This non-functional approach is specifically used to
   * allow instances to be able to refer back to its parent without
   * having to duplicate it for every instance.
   * This is set at the very end and returned, so it can be referenced
   * throughout instance methods.
   */
  // eslint-disable-next-line functional/no-let
  let model = null
  PROTECTED_KEYS.forEach(key => {
    if (key in keyToProperty) {
      throw new Error(`Cannot use ${key}. This is a protected value.`)
    }
  })
  const instanceProperties = Object.entries(keyToProperty).filter(
    ([key, _]) => MODEL_DEF_KEYS.includes(key) === false
  )
  const specialProperties1 = Object.entries(keyToProperty).filter(([key, _]) =>
    MODEL_DEF_KEYS.includes(key)
  )
  const properties = instanceProperties.reduce((acc, [key, property]) => {
    return merge(acc, { [key]: property })
  }, {})
  const specialProperties = specialProperties1.reduce(
    (acc, [key, property]) => {
      return merge(acc, { [key]: property })
    },
    {}
  )

  const create = (instanceValues = {}) => {
    // eslint-disable-next-line functional/no-let
    let instance = null
    const specialInstanceProperties1 = MODEL_DEF_KEYS.reduce((acc, key) => {
      if (key in instanceValues) {
        return { ...acc, [key]: instanceValues[key] }
      }
      return acc
    }, {})
    const loadedInternals = instanceProperties.reduce(
      (acc, [key, property]) => {
        const propertyGetter = property.createGetter(instanceValues[key])
        const propertyValidator = property.getValidator(propertyGetter)
        const getPropertyKey = createPropertyTitle(key)
        const fleshedOutInstanceProperties = {
          [getPropertyKey]: propertyGetter,
          functions: {
            validate: {
              [key]: propertyValidator,
            },
          },
        }
        return merge(acc, fleshedOutInstanceProperties)
      },
      {}
    )
    const frameworkProperties = {
      meta: {
        getModel: () => model,
      },
      functions: {
        toObj: toObj(loadedInternals),
        validate: {
          model: createModelValidator(loadedInternals),
        },
      },
    }
    const fleshedOutInstanceFunctions = Object.entries(
      instanceFunctions
    ).reduce((acc, [key, func]) => {
      return merge(acc, {
        functions: {
          [key]: (...args) => {
            return func(instance)(...args)
          },
        },
      })
    }, {})
    instance = merge(
      {},
      loadedInternals,
      specialProperties,
      fleshedOutInstanceFunctions,
      frameworkProperties,
      specialInstanceProperties1
    )
    if (instanceCreatedCallback) {
      instanceCreatedCallback(instance)
    }
    return instance
  }

  const fleshedOutModelFunctions = Object.entries(modelFunctions).reduce(
    (acc, [key, func]) => {
      return merge(acc, {
        [key]: (...args) => {
          return func(model)(...args)
        },
      })
    },
    {}
  )

  // This sets the model that is used by the instances later.
  model = merge({}, fleshedOutModelFunctions, {
    create,
    getName: () => modelName,
    getProperties: () => properties,
  })
  return model
}

module.exports = {
  Model,
}
