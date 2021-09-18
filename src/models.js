const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const { toObj } = require('./serialization')
const { createPropertyTitle } = require('./utils')
const { createModelValidator } = require('./validation')

const MODEL_DEF_KEYS = ['meta', 'functions']
const PROTECTED_KEYS = ['model']

const createModel = (modelName, keyToField) => {
  PROTECTED_KEYS.forEach(key => {
    if (key in keyToField) {
      throw new Error(`Cannot use ${key}. This is a protected value.`)
    }
  })
  const fieldProperties = Object.entries(keyToField).filter(
    ([key, _]) => !(key in MODEL_DEF_KEYS)
  )
  const fields = fieldProperties.reduce((acc, [key, field]) => {
    return { ...acc, [key]: field }
  }, {})
  const modelDefProperties = merge(
    pickBy(keyToField, (value, key) => MODEL_DEF_KEYS.includes(key)),
    {
      meta: {
        fields,
        modelName,
      },
    }
  )

  return (instanceValues = {}) => {
    const loadedInternals = fieldProperties.reduce((acc, [key, field]) => {
      const fieldGetter = field.createGetter(instanceValues[key])
      const fieldValidator = field.getValidator(fieldGetter)
      const getFieldKey = createPropertyTitle(key)
      const fleshedOutField = {
        [getFieldKey]: fieldGetter,
        functions: {
          validate: {
            [key]: fieldValidator,
          },
        },
      }
      return merge(acc, fleshedOutField)
    }, {})
    const frameworkProperties = {
      functions: {
        toObj: toObj(loadedInternals),
        validate: {
          model: createModelValidator(loadedInternals),
        },
      },
    }
    return merge(loadedInternals, modelDefProperties, frameworkProperties)
  }
}

module.exports = {
  createModel,
}
