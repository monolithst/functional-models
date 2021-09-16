const { createPropertyTitle, createUuid } = require('./utils')

const property = (key, arg) => {
  if (typeof key === 'object') {
    return Object.entries(key).reduce((acc, [keyName, realValue]) => {
      const propertyKey = createPropertyTitle(keyName)
      return {
        ...acc,
        [propertyKey]: () => realValue,
      }
    }, {})
  }
  const method = typeof arg === 'function' ? arg : () => arg
  const propertyKey = createPropertyTitle(key)
  return {
    [propertyKey]: method,
  }
}

const named = name => property('Name', name)
const typed = type => property('Type', type)
const uniqueId = (id = null) => {
  return property('id', id || createUuid())
}

module.exports = {
  property,
  named,
  typed,
  uniqueId,
}
