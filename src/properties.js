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

const UniqueId = config =>
  Property({
    ...config,
    lazyLoadMethod: value => {
      if (!value) {
        return createUuid()
      }
      return value
    },
  })

const DateProperty = config =>
  Property({
    ...config,
    lazyLoadMethod: value => {
      if (!value && config.autoNow) {
        return new Date()
      }
      return value
    },
  })

const ReferenceProperty = config => {
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

const ArrayProperty = (config = {}) =>
  Property({
    defaultValue: [],
    ...config,
    isArray: true,
  })

const ObjectProperty = (config = {}) =>
  Property(
    merge(config, {
      validators: [isType('object')],
    })
  )

const TextProperty = (config = {}) =>
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

const IntegerProperty = (config = {}) =>
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

const NumberProperty = (config = {}) =>
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

const ConstantValueProperty = (value, config = {}) =>
  TextProperty(
    merge(config, {
      value,
    })
  )

const EmailProperty = (config = {}) =>
  TextProperty(
    merge(config, {
      validators: [meetsRegex(EMAIL_REGEX)],
    })
  )

module.exports = {
  Property,
  UniqueId,
  DateProperty,
  ArrayProperty,
  ReferenceProperty,
  IntegerProperty,
  TextProperty,
  ConstantValueProperty,
  NumberProperty,
  ObjectProperty,
  EmailProperty,
}
