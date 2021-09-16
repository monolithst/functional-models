const { lazyValue, createPropertyTitle } = require('./utils')

const lazyProperty = (key, method, { selector = null } = {}) => {
  const lazy = lazyValue(method)
  const propertyKey = createPropertyTitle(key)
  return {
    [propertyKey]: async () => {
      const value = await lazy()
      return selector ? selector(value) : value
    },
  }
}

module.exports = {
  lazyProperty,
}
