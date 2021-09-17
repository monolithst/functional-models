const merge = require('lodash/merge')
const get = require('lodash/get')
const { toJson } = require('./serialization')
const { createPropertyTitle } = require('./utils')

const findValidateFunctions = smartObject => {
  return Object.entries(get(smartObject, 'functions.validate', {}))
}

const _getValue = (field, value) => {
  if (!value) {
    if (field.defaultValue) {
      return field.defaultValue
    }
    if (field.value) {
      return field.value
    }
  }
  return value
}


const smartObjectPrototype = (keyToField, { metaProperties={}, functions={}}={}) => {
  const passedInData = merge(
    metaProperties ? { meta: { ...metaProperties } } : {},
    { functions }
  )
  return (instanceValues) => {
    const loadedInternals = Object.entries(keyToField).reduce((acc, [key, field]) => {
      const value = _getValue(field, instanceValues[key])
      const fieldInstance = field.createGetter(value)
      const fieldValidator = field.getValidator(value)
      const getKey = createPropertyTitle(key)
      const data = {
        [getKey]: fieldInstance,
        functions: {
          validate: {
            [key]: fieldValidator
          }
        }
      }
      return merge(acc, data)
    }, {})
    const allUserData = merge(passedInData, loadedInternals)
    const internalFunctions = {
      functions: {
        ...functions,
        toJson: toJson(loadedInternals),
        validate: {
          object: async () => {
            const keysAndfunctions = findValidateFunctions(loadedInternals)
            const data = await Promise.all(
              keysAndfunctions.map(async ([key, validator]) => {
                return [key, await validator()]
              })
            )
            return data
              .filter(([_, errors]) => Boolean(errors) && errors.length > 0)
              .reduce((acc, [key, errors]) => {
                return { ...acc, [key]: errors }
              }, {})
          },
        },
      },
    }
    return merge(allUserData, internalFunctions)
  }
}

const smartObject = (
  internals,
  { metaProperties = {}, functions = {} } = {}
) => {
  const realInternals = Array.isArray(internals)
    ? internals.reduce((acc, obj) => merge(acc, obj), {})
    : internals

  const passedInData = merge(
    metaProperties ? { meta: { ...metaProperties } } : {},
    realInternals,
    { functions }
  )
  const internalFunctions = {
    functions: {
      ...functions,
      toJson: toJson(realInternals),
      validate: {
        object: async () => {
          const keysAndfunctions = findValidateFunctions(realInternals)
          const data = await Promise.all(
            keysAndfunctions.map(async ([key, validator]) => {
              return [key, await validator()]
            })
          )
          return data
            .filter(([_, errors]) => Boolean(errors) && errors.length > 0)
            .reduce((acc, [key, errors]) => {
              return { ...acc, [key]: errors }
            }, {})
        },
      },
    },
  }
  return merge(passedInData, internalFunctions)
}

module.exports = {
  smartObject,
  smartObjectPrototype,
  findValidateFunctions,
}
