const { toJson } = require('./serialization')

const smartObject = (
  internals,
  { metaProperties = {}, functions = {} } = {}
) => {
  const realInternals = Array.isArray(internals)
    ? internals.reduce((acc, obj) => ({ ...acc, ...obj }), {})
    : internals

  return {
    ...(metaProperties ? { meta: { ...metaProperties } } : {}),
    ...realInternals,
    functions: {
      ...functions,
      toJson: toJson(realInternals),
    },
  }
}

module.exports = {
  smartObject,
}
