const identity = require('lodash/identity')
const get = require('lodash/get')
const isFunction = require('lodash/isFunction')
const merge = require('lodash/merge')
const {
  createPropertyValidator,
  emptyValidator,
  maxTextLength,
  minTextLength,
  minNumber,
  maxNumber,
  isType,
  referenceTypeMatch,
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

const _mergeValidators = (config, validators) => {
  return [...validators, ...(config.validators ? config.validators : [])]
}

const Property = (config = {}, additionalMetadata = {}) => {
  const value = config.value || undefined
  const defaultValue = config.defaultValue || undefined
  const lazyLoadMethod = config.lazyLoadMethod || false
  const valueSelector = config.valueSelector || identity
  if (typeof valueSelector !== 'function') {
    throw new Error(`valueSelector must be a function`)
  }

  return {
    ...additionalMetadata,
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
      const _propertyValidatorWrapper = async (instance, instanceData) => {
        return validator(await valueGetter(), instance, instanceData)
      }
      return _propertyValidatorWrapper
    },
  }
}

const UniqueId = (config = {}) =>
  Property({
    ...config,
    lazyLoadMethod: value => {
      if (!value) {
        return createUuid()
      }
      return value
    },
  })

const DateProperty = (config = {}) =>
  Property({
    ...config,
    lazyLoadMethod: value => {
      if (!value && config.autoNow) {
        return new Date()
      }
      return value
    },
  })

const ReferenceProperty = (model, config = {}) => {
  if (!model) {
    throw new Error('Must include the referenced model')
  }

  const _getModel = () => {
    if (isFunction(model)) {
      return model()
    }
    return model
  }

  const validators = _mergeValidators(config, [referenceTypeMatch(model)])

  const lazyLoadMethod = async instanceValues => {
    const _getId = () => {
      if (!instanceValues) {
        return null
      }
      const theModel = _getModel()
      const primaryKey = theModel.getPrimaryKeyName()
      if (instanceValues[primaryKey]) {
        return instanceValues[primaryKey]
      }
      const primaryKeyFunc = get(instanceValues, 'functions.getPrimaryKey')
      if (primaryKeyFunc) {
        return primaryKeyFunc()
      }
      return instanceValues
    }

    const valueIsModelInstance =
      Boolean(instanceValues) && Boolean(instanceValues.functions)

    const _getInstanceReturn = objToUse => {
      // We need to determine if the object we just go is an actual model instance to determine if we need to make one.
      const objIsModelInstance =
        Boolean(objToUse) && Boolean(objToUse.functions)
      const instance = objIsModelInstance
        ? objToUse
        : _getModel().create(objToUse)
      return merge({}, instance, {
        functions: {
          toObj: _getId,
        },
      })
    }

    if (valueIsModelInstance) {
      return _getInstanceReturn(instanceValues)
    }
    if (config.fetcher) {
      const id = await _getId()
      const model = _getModel()
      const obj = await config.fetcher(model, id)
      return _getInstanceReturn(obj)
    }
    return _getId(instanceValues)
  }

  return Property(
    merge({}, config, {
      validators,
      lazyLoadMethod,
    }),
    {
      meta: {
        getReferencedModel: _getModel,
      },
    }
  )
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
      validators: _mergeValidators(config, [isType('object')]),
    })
  )

const TextProperty = (config = {}) =>
  Property(
    merge(config, {
      isString: true,
      validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config, 'maxLength', value =>
          maxTextLength(value)
        ),
        _getValidatorFromConfigElseEmpty(config, 'minLength', value =>
          minTextLength(value)
        ),
      ]),
    })
  )

const IntegerProperty = (config = {}) =>
  Property(
    merge(config, {
      isInteger: true,
      validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config, 'minValue', value =>
          minNumber(value)
        ),
        _getValidatorFromConfigElseEmpty(config, 'maxValue', value =>
          maxNumber(value)
        ),
      ]),
    })
  )

const NumberProperty = (config = {}) =>
  Property(
    merge(config, {
      isNumber: true,
      validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config, 'minValue', value =>
          minNumber(value)
        ),
        _getValidatorFromConfigElseEmpty(config, 'maxValue', value =>
          maxNumber(value)
        ),
      ]),
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
      validators: _mergeValidators(config, [meetsRegex(EMAIL_REGEX)]),
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
