const identity = require('lodash/identity')
const { createPropertyValidator } = require('./validation')
const { lazyValue, createUuid } = require('./utils')

const field = (config={}) => {
  const value = config.value || undefined
  const defaultValue = config.defaultValue || undefined
  const lazyLoadMethod = config.lazyLoadMethod || false
  const valueSelector = config.valueSelector || identity
  if (typeof valueSelector !== 'function') {
    throw new Error(`valueSelector must be a function`)
  }
  return {
    value,
    defaultValue,
    lazyLoadMethod,
    valueSelector,
    createGetter: (instanceValue) => {
      if (value !== undefined) {
        return () => value
      }
      const method = lazyLoadMethod
        ? lazyValue(lazyLoadMethod)
        : typeof instanceValue === 'function'
          ? instanceValue
          : () => instanceValue
      return async () => {
        return valueSelector(await method(instanceValue))
      }
    },
    getValidator: (instanceValue) => createPropertyValidator(config)(instanceValue)
  }
}

const uniqueId = config => field({
  ...config,
  lazyLoadMethod: (value) => {
    if (!value) {
      return createUuid()
    }
    return value
  }
})

const dateField = config => field({
  ...config,
  lazyLoadMethod: (value) => {
    if (!value && config.autoNow) {
      return new Date()
    }
    return value
  }
})

const referenceField = (config) => {
  return field({
    ...config,
    lazyLoadMethod: async (smartObj) => {
      const _getId = () => {
        if (!smartObj) {
          return null
        }
        return smartObj && smartObj.id
          ? smartObj.id
          : smartObj.getId
            ? smartObj.getId()
            : smartObj
      }
      const _getSmartObjReturn = objToUse => {
        return {
          ...objToUse,
          functions: {
            ...(objToUse.functions ? objToUse.functions : {}),
            toJson: _getId,
          },
        }
      }
      const valueIsSmartObj = smartObj && smartObj.functions
      if (valueIsSmartObj) {
        return _getSmartObjReturn(smartObj)
      }
      if (config.fetcher) {
        const obj = await config.fetcher(smartObj)
        return _getSmartObjReturn(obj)
      }
      return _getId(smartObj)
    }
  })
}


module.exports = {
  field,
  uniqueId,
  dateField,
  referenceField,
}