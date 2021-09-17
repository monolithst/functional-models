const merge = require('lodash/merge')
const get = require('lodash/get')
const { toJson } = require('./serialization')

const findValidateFunctions = smartObject => {
  return Object.entries(get(smartObject, 'functions.validate', {}))
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
  findValidateFunctions,
}
