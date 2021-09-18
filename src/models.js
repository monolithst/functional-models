const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const { toObj } = require('./serialization')
const { createPropertyTitle } = require('./utils')
const { createModelValidator } = require('./validation')

const MODEL_DEF_KEYS = ['meta', 'functions']
const PROTECTED_KEYS = ['model']

const Model = (modelName, keyToProperty, modelExtensions={}, {instanceCreatedCallback=null}={}) => {
  PROTECTED_KEYS.forEach(key => {
    if (key in keyToProperty) {
      throw new Error(`Cannot use ${key}. This is a protected value.`)
    }
  })
  const instanceProperties = Object.entries(keyToProperty).filter(
    ([key, _]) => !(key in MODEL_DEF_KEYS)
  )
  const properties = instanceProperties.reduce((acc, [key, property]) => {
    return { ...acc, [key]: property }
  }, {})
  const modelProperties = merge(
    pickBy(keyToProperty, (value, key) => MODEL_DEF_KEYS.includes(key)),
    {
      meta: {
        properties,
        modelName,
      },
    }
  )

  const create = (instanceValues = {}) => {
    const loadedInternals = instanceProperties.reduce((acc, [key, property]) => {
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
    }, {})
    const frameworkProperties = {
      functions: {
        toObj: toObj(loadedInternals),
        validate: {
          model: createModelValidator(loadedInternals),
        },
      },
    }
    const instance = merge({}, loadedInternals, modelProperties, frameworkProperties)
    if (instanceCreatedCallback) {
      instanceCreatedCallback(instance)
    }
    return instance
  }

  return merge(
    {},
    modelExtensions,
    {
      create,
      name: modelName,
    }
  )
}

module.exports = {
  Model,
}
