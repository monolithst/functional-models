const identity = require('lodash/identity')
const { createFieldValidator } = require('./validation')
const { createUuid } = require('./utils')
const { lazyValue } = require('./lazy')

const field = (config = {}) => {
  const value = config.value || undefined
  const defaultValue = config.defaultValue || undefined
  const lazyLoadMethod = config.lazyLoadMethod || false
  const valueSelector = config.valueSelector || identity
  if (typeof valueSelector !== 'function') {
    throw new Error(`valueSelector must be a function`)
  }

  return {
    createGetter: instanceValue => {
      if (value !== undefined) {
        return () => value
      }
      if (
        defaultValue !== undefined &&
        (instanceValue === null || instanceValue === undefined)
      ) {
        return () => defaultValue
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
    getValidator: valueGetter => {
      return async () => {
        return createFieldValidator(config)(await valueGetter())
      }
    },
  }
}

const uniqueId = config =>
  field({
    ...config,
    lazyLoadMethod: value => {
      if (!value) {
        return createUuid()
      }
      return value
    },
  })

const dateField = config =>
  field({
    ...config,
    lazyLoadMethod: value => {
      if (!value && config.autoNow) {
        return new Date()
      }
      return value
    },
  })

const referenceField = config => {
  return field({
    ...config,
    lazyLoadMethod: async smartObj => {
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
    },
  })
}

const arrayField = (config = {}) =>
  field({
    defaultValue: [],
    ...config,
    isArray: true,
  })

module.exports = {
  field,
  uniqueId,
  dateField,
  arrayField,
  referenceField,
}
