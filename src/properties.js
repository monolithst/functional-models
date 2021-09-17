const { createPropertyTitle, createUuid } = require('./utils')
const { createPropertyValidate } = require('./validation')

const property = (key, config={}) => (arg) => {
  const method = typeof arg === 'function' ? arg : () => arg
  const propertyKey = createPropertyTitle(key)
  return {
    [propertyKey]: method,
    ...createPropertyValidate(key, config)(arg)
  }
}

const named = (config) => property('Name', config)
const typed = (config) => property('Type', config)
const uniqueId = (config) => (id = null) => property('id', config)(id || createUuid(), config)

module.exports = {
  property,
  named,
  typed,
  uniqueId,
}
