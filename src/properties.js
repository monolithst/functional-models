const identity = require('lodash/identity')
const merge = require('lodash/merge')
const {
  createPropertyValidator,
  emptyValidator,
  maxTextLength,
  minTextLength,
  minNumber,
  maxNumber,
  isType,
  meetsRegex,
} = require('./validation')
const { createUuid } = require('./utils')
const { lazyValue } = require('./lazy')

const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

const _getValidatorFromConfigElseEmpty = (config, key, validatorGetter) => {
  if (key in config) {
    return validatorGetter(config[key])
  }
  return emptyValidator
}

const Property = (config = {}) => {
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
      const validator = createPropertyValidator(config)
      const _propertyValidatorWrapper = async () => {
        return validator(await valueGetter())
      }
      return _propertyValidatorWrapper
    },
  }
}

const uniqueId = config =>
  Property({
    ...config,
    lazyLoadMethod: value => {
      if (!value) {
        return createUuid()
      }
      return value
    },
  })

const dateProperty = config =>
  Property({
    ...config,
    lazyLoadMethod: value => {
      if (!value && config.autoNow) {
        return new Date()
      }
      return value
    },
  })

const referenceProperty = config => {
  return Property({
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
            toObj: _getId,
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

const arrayProperty = (config = {}) =>
  Property({
    defaultValue: [],
    ...config,
    isArray: true,
  })

const objectProperty = (config = {}) =>
  Property(
    merge(config, {
      validators: [isType('object')],
    })
  )

const textProperty = (config = {}) =>
  Property(
    merge(config, {
      isString: true,
      validators: [
        _getValidatorFromConfigElseEmpty(config, 'maxLength', value =>
          maxTextLength(value)
        ),
        _getValidatorFromConfigElseEmpty(config, 'minLength', value =>
          minTextLength(value)
        ),
      ],
    })
  )

const integerProperty = (config = {}) =>
  Property(
    merge(config, {
      isInteger: true,
      validators: [
        _getValidatorFromConfigElseEmpty(config, 'minValue', value =>
          minNumber(value)
        ),
        _getValidatorFromConfigElseEmpty(config, 'maxValue', value =>
          maxNumber(value)
        ),
      ],
    })
  )

const numberProperty = (config = {}) =>
  Property(
    merge(config, {
      isNumber: true,
      validators: [
        _getValidatorFromConfigElseEmpty(config, 'minValue', value =>
          minNumber(value)
        ),
        _getValidatorFromConfigElseEmpty(config, 'maxValue', value =>
          maxNumber(value)
        ),
      ],
    })
  )

const constantValueProperty = (value, config = {}) =>
  textProperty(
    merge(config, {
      value,
    })
  )

const emailProperty = (config = {}) =>
  textProperty(
    merge(config, {
      validators: [meetsRegex(EMAIL_REGEX)],
    })
  )

module.exports = {
  Property,
  uniqueId,
  dateProperty,
  arrayProperty,
  referenceProperty,
  integerProperty,
  textProperty,
  constantValueProperty,
  numberProperty,
  objectProperty,
  emailProperty,
}
