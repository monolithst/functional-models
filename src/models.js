const merge = require('lodash/merge')
const get = require('lodash/get')
const { toJson } = require('./serialization')
const { createPropertyTitle } = require('./utils')
const { createModelValidator } = require('./validation')

const SYSTEM_KEYS = ['meta', 'functions']

const PROTECTED_KEYS = ['model']

const createModel = keyToField => {
  PROTECTED_KEYS.forEach(key => {
    if (key in keyToField) {
      throw new Error(`Cannot use ${key}. This is a protected value.`)
    }
  })
  const systemProperties = SYSTEM_KEYS.reduce((acc, key) => {
    const value = get(keyToField, key, {})
    return { ...acc, [key]: value }
  }, {})
  const nonSystemProperties = Object.entries(keyToField).filter(
    ([key, _]) => !(key in SYSTEM_KEYS)
  )

  return instanceValues => {
    const loadedInternals = nonSystemProperties.reduce((acc, [key, field]) => {
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
    const allUserData = merge(systemProperties, loadedInternals)
    const internalFunctions = {
      functions: {
        toJson: toJson(loadedInternals),
        validate: {
          model: createModelValidator(loadedInternals),
        },
      },
    }
    return merge(allUserData, internalFunctions)
  }
}

module.exports = {
  createModel,
}
