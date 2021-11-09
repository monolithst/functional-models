import identity from 'lodash/identity'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import merge from 'lodash/merge'
import {
  createPropertyValidator,
  emptyValidator,
  maxTextLength,
  minTextLength,
  minNumber,
  maxNumber,
  isType,
  referenceTypeMatch,
  meetsRegex,
} from './validation'
import { PROPERTY_TYPES } from './constants'
import { lazyValue } from './lazy'
import { toTitleCase, createUuid } from './utils'
import {
  IProperty,
  IPropertyInstance,
  IPropertyConfig,
  IPropertyValidatorComponent, IPropertyValidator, IPropertyValidatorComponentSync
} from './interfaces'

const createPropertyTitle = (key: string) => {
  const goodName = toTitleCase(key)
  return `get${goodName}`
}

const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

interface BLAH<T> {

}

function _getValidatorFromConfigElseEmpty<T>(
    input: T|undefined,
    // eslint-disable-next-line no-unused-vars
    validatorGetter: (t: T) => IPropertyValidatorComponent
){
  if (input !== undefined) {
    const validator = validatorGetter(input)
    return validator
  }
  return emptyValidator
}

const _mergeValidators = (config: IPropertyConfig|undefined, validators: readonly IPropertyValidatorComponent[]) => {
  return [...validators, ...(config?.validators ? config.validators : [])]
}

const Property : IProperty = (type: string, config : IPropertyConfig, additionalMetadata = {}) => {
  if (!type && !config.type) {
    throw new Error(`Property type must be provided.`)
  }
  if (config.type) {
    type = config.type
  }
  const getConstantValue = () => config.value !== undefined ? config.value : undefined
  const getDefaultValue = () => config.defaultValue !== undefined ? config.defaultValue : undefined
  const getChoices = () => config.choices ? config.choices : []
  const lazyLoadMethod = config.lazyLoadMethod || false
  const valueSelector = config.valueSelector || identity
  if (typeof valueSelector !== 'function') {
    throw new Error(`valueSelector must be a function`)
  }


  return {
    ...additionalMetadata,
    getConfig: () => config,
    getChoices,
    getDefaultValue,
    getConstantValue,
    getPropertyType: () => type,
    createGetter: instanceValue => {
      const value = getConstantValue()
      if (value !== undefined) {
        return () => value
      }
      const defaultValue = getDefaultValue()
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
      const _propertyValidatorWrapper : IPropertyValidator = async (instance, instanceData, options={}) => {
        return validator(await valueGetter(), instance, instanceData, options)
      }
      return _propertyValidatorWrapper
    },
  }
}

const DateProperty = (config?: IPropertyConfig, additionalMetadata={}) => Property(PROPERTY_TYPES.DateProperty, {
  ...config,
  lazyLoadMethod: value => {
    if (!value && config?.autoNow) {
      return new Date()
    }
    return value
  },
}, additionalMetadata)

const ReferenceProperty = (model, config = {}, additionalMetadata={}) => {
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

  const _getId = (instanceValues) => () => {
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

  const lazyLoadMethod = async instanceValues => {

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
          toObj: _getId(instanceValues),
        },
      })
    }

    if (valueIsModelInstance) {
      return _getInstanceReturn(instanceValues)
    }
    if (config.fetcher) {
      const id = await _getId(instanceValues)()
      const model = _getModel()
      const obj = await config.fetcher(model, id)
      return _getInstanceReturn(obj)
    }
    return _getId(instanceValues)()
  }

  return Property(
    PROPERTY_TYPES.ReferenceProperty,
    merge({}, config, {
      validators,
      lazyLoadMethod,
    }),
    {
      ...additionalMetadata,
      meta: {
        getReferencedId: (instanceValues) => _getId(instanceValues)(),
        getReferencedModel: _getModel,
      },
    }
  )
}

const ArrayProperty = (config = {}, additionalMetadata={}) =>
  Property(
    PROPERTY_TYPES.ArrayProperty,
    {
    defaultValue: [],
    ...config,
    isArray: true,
  }, additionalMetadata)

const ObjectProperty = (config = {}, additionalMetadata={}) =>
  Property(
    PROPERTY_TYPES.ObjectProperty,
    merge(config, {
      validators: _mergeValidators(config, [isType('object')]),
    }),
    additionalMetadata
  )

const TextProperty = (config = {}, additionalMetadata={} ) =>
  Property(
    PROPERTY_TYPES.TextProperty,
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
    }),
    additionalMetadata
  )

const IntegerProperty = (config = {}, additionalMetadata={}) =>
  Property(
    PROPERTY_TYPES.IntegerProperty,
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
    }),
    additionalMetadata
  )

const NumberProperty = (config : IPropertyConfig, additionalMetadata={}) =>
  Property(
    PROPERTY_TYPES.NumberProperty,
    merge(config, {
      isNumber: true,
      validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config?.minValue, value =>
          minNumber(value)
        ),
        _getValidatorFromConfigElseEmpty(config?.maxValue, value =>
          maxNumber(value)
        ),
      ]),
    }),
    additionalMetadata
  )

const ConstantValueProperty = (value, config: IPropertyConfig, additionalMetadata={}) =>
  TextProperty(
    merge(config, {
      type: PROPERTY_TYPES.ConstantValueProperty,
      value,
    }),
    additionalMetadata
  )

const EmailProperty = (config: IPropertyConfig, additionalMetadata={}) =>
  TextProperty(
    merge(config, {
      type: PROPERTY_TYPES.EmailProperty,
      validators: _mergeValidators(config, [meetsRegex(EMAIL_REGEX)]),
    }),
    additionalMetadata
  )

const BooleanProperty = (config: IPropertyConfig, additionalMetadata={}) => Property(
  PROPERTY_TYPES.BooleanProperty,
  merge(config, {
      isBoolean: true,
      validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config?.minValue, value =>
          minNumber(value)
        ),
        _getValidatorFromConfigElseEmpty(config?.maxValue, value =>
          maxNumber(value)
        ),
      ]),
    }),
    additionalMetadata
)

const UniqueId = (config: IPropertyConfig, additionalMetadata={}) =>
  Property(
    PROPERTY_TYPES.UniqueId,
    {
    ...config,
    lazyLoadMethod: value => {
      if (!value) {
        return createUuid()
      }
      return value
    },
  }, additionalMetadata)



export {
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
  BooleanProperty,
  createPropertyTitle,
}
