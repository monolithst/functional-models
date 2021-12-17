import identity from 'lodash/identity'
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
import { createUuid } from './utils'
import {
  ReferenceValueType,
  ModelInstance,
  MaybeEmpty,
  PrimaryKeyType,
  Model,
  PropertyInstance,
  FunctionalType,
  PropertyConfig,
  ValueGetter,
  MaybeFunction,
  Arrayable,
  PropertyValidatorComponent,
  PropertyValidator,
  ReferencePropertyInstance,
  ModelInstanceInputData,
  FunctionalModel,
  JsonAble,
} from './interfaces'

const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

function _getValidatorFromConfigElseEmpty<T>(
  input: T | undefined,
  // eslint-disable-next-line no-unused-vars
  validatorGetter: (t: T) => PropertyValidatorComponent
) {
  if (input !== undefined) {
    const validator = validatorGetter(input)
    return validator
  }
  return emptyValidator
}

const _mergeValidators = (
  config: PropertyConfig | undefined,
  validators: readonly PropertyValidatorComponent[]
) => {
  return [...validators, ...(config?.validators ? config.validators : [])]
}

const Property = <T extends Arrayable<FunctionalType>>(
  type: string,
  config: PropertyConfig = {},
  additionalMetadata = {}
) => {
  if (!type && !config?.type) {
    throw new Error(`Property type must be provided.`)
  }
  if (config?.type) {
    type = config.type
  }
  const getConstantValue = () =>
    (config?.value !== undefined ? config.value : undefined) as T
  const getDefaultValue = () =>
    (config?.defaultValue !== undefined ? config.defaultValue : undefined) as T
  const getChoices = () => config?.choices || []
  const lazyLoadMethod = config?.lazyLoadMethod || false
  const valueSelector = config?.valueSelector || identity
  if (typeof valueSelector !== 'function') {
    throw new Error(`valueSelector must be a function`)
  }

  const r: PropertyInstance<T> = {
    ...additionalMetadata,
    getConfig: () => config || {},
    getChoices,
    getDefaultValue,
    getConstantValue,
    getPropertyType: () => type,
    createGetter: (instanceValue: T): ValueGetter => {
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
        ? // eslint-disable-next-line no-unused-vars
          (lazyValue(lazyLoadMethod) as (value: T) => Promise<T>)
        : typeof instanceValue === 'function'
        ? (instanceValue as () => T)
        : () => instanceValue
      return () => {
        return valueSelector(method(instanceValue))
      }
    },
    getValidator: valueGetter => {
      const validator = createPropertyValidator(valueGetter, config)
      const _propertyValidatorWrapper: PropertyValidator = async (
        instance,
        instanceData
      ) => {
        return validator(instance, instanceData)
      }
      return _propertyValidatorWrapper
    },
  }
  return r
}

const DateProperty = (config: PropertyConfig = {}, additionalMetadata = {}) =>
  Property<MaybeEmpty<Date|string>>(
    PROPERTY_TYPES.DateProperty,
    merge(
      {
        lazyLoadMethod: (value: Arrayable<FunctionalType>) => {
          if (!value && config?.autoNow) {
            return new Date()
          }
          if (typeof value === 'string') {
            return new Date(value)
          }
          return value
        },
      },
      config
    ),
    additionalMetadata
  )

const ArrayProperty = <T extends FunctionalType>(
  config = {},
  additionalMetadata = {}
) =>
  Property<readonly T[]>(
    PROPERTY_TYPES.ArrayProperty,
    {
      defaultValue: [],
      ...config,
      isArray: true,
    },
    additionalMetadata
  )

const ObjectProperty = (config = {}, additionalMetadata = {}) =>
  Property<{ readonly [s: string]: JsonAble }>(
    PROPERTY_TYPES.ObjectProperty,
    merge(config, {
      validators: _mergeValidators(config, [isType('object')]),
    }),
    additionalMetadata
  )

const TextProperty = (config: PropertyConfig = {}, additionalMetadata = {}) =>
  Property<MaybeEmpty<string>>(
    PROPERTY_TYPES.TextProperty,
    merge(config, {
      isString: true,
      validators: _mergeValidators(config, [
        _getValidatorFromConfigElseEmpty(config?.maxLength, (value: number) =>
          maxTextLength(value)
        ),
        _getValidatorFromConfigElseEmpty(config?.minLength, (value: number) =>
          minTextLength(value)
        ),
      ]),
    }),
    additionalMetadata
  )

const IntegerProperty = (
  config: PropertyConfig = {},
  additionalMetadata = {}
) =>
  Property<MaybeEmpty<number>>(
    PROPERTY_TYPES.IntegerProperty,
    merge(config, {
      isInteger: true,
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

const NumberProperty = (config: PropertyConfig = {}, additionalMetadata = {}) =>
  Property<MaybeEmpty<number>>(
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

const ConstantValueProperty = (
  value: string,
  config: PropertyConfig = {},
  additionalMetadata = {}
) =>
  TextProperty(
    merge(config, {
      type: PROPERTY_TYPES.ConstantValueProperty,
      value,
    }),
    additionalMetadata
  )

const EmailProperty = (config: PropertyConfig = {}, additionalMetadata = {}) =>
  TextProperty(
    merge(config, {
      type: PROPERTY_TYPES.EmailProperty,
      validators: _mergeValidators(config, [meetsRegex(EMAIL_REGEX)]),
    }),
    additionalMetadata
  )

const BooleanProperty = (
  config: PropertyConfig = {},
  additionalMetadata = {}
) =>
  Property<MaybeEmpty<boolean>>(
    PROPERTY_TYPES.BooleanProperty,
    merge(config, {
      isBoolean: true,
    }),
    additionalMetadata
  )

const UniqueId = (config: PropertyConfig = {}, additionalMetadata = {}) =>
  Property<string>(
    PROPERTY_TYPES.UniqueId,
    merge(
      {
        lazyLoadMethod: (value: Arrayable<FunctionalType>) => {
          if (!value) {
            return createUuid()
          }
          return value
        },
      },
      config
    ),
    additionalMetadata
  )

const ReferenceProperty = <T extends FunctionalModel>(
  model: MaybeFunction<Model<T>>,
  config: PropertyConfig = {},
  additionalMetadata = {}
) => {
  if (!model) {
    throw new Error('Must include the referenced model')
  }

  const _getModel = () => {
    if (typeof model === 'function') {
      return model()
    }
    return model
  }

  const validators = _mergeValidators(config, [referenceTypeMatch<T>(model)])

  const _getId =
    (instanceValues: ReferenceValueType<T>) =>
    (): MaybeEmpty<PrimaryKeyType> => {
      if (!instanceValues) {
        return null
      }
      if (typeof instanceValues === 'number') {
        return instanceValues
      }
      if (typeof instanceValues === 'string') {
        return instanceValues
      }
      if ((instanceValues as ModelInstance<T>).getPrimaryKey) {
        return (instanceValues as ModelInstance<T>).getPrimaryKey()
      }

      const theModel = _getModel()
      const primaryKey = theModel.getPrimaryKeyName()

      // @ts-ignore
      return (instanceValues as ModelInstanceInputData<T>)[
        primaryKey
      ] as PrimaryKeyType
    }

  const lazyLoadMethod = async (instanceValues: ReferenceValueType<T>) => {
    const valueIsModelInstance =
      instanceValues && (instanceValues as ModelInstance<T>).getPrimaryKeyName
    const _getInstanceReturn = (objToUse: ReferenceValueType<T>) => {
      // We need to determine if the object we just go is an actual model instance to determine if we need to make one.
      const objIsModelInstance =
        instanceValues && (instanceValues as ModelInstance<T>).getPrimaryKeyName

      const instance = objIsModelInstance
        ? objToUse
        : _getModel().create(objToUse as ModelInstanceInputData<T>)
      // We are replacing the toObj function, because the reference type in the end should be the primary key when serialized.
      return merge({}, instance, {
        toObj: _getId(instanceValues),
      })
    }

    if (valueIsModelInstance) {
      return _getInstanceReturn(instanceValues)
    }
    if (config?.fetcher) {
      const id = await _getId(instanceValues)()
      const model = _getModel()
      if (id !== null && id !== undefined) {
        const obj = await config.fetcher(model, id)
        return _getInstanceReturn(obj)
      }
      return null
    }
    return _getId(instanceValues)()
  }

  const p: ReferencePropertyInstance<T> = merge(
    Property<ModelInstance<T> | T | MaybeEmpty<PrimaryKeyType>>(
      PROPERTY_TYPES.ReferenceProperty,
      merge({}, config, {
        validators,
        lazyLoadMethod,
      }),
      additionalMetadata
    ),
    {
      getReferencedId: (instanceValues: ReferenceValueType<T>) =>
        _getId(instanceValues)(),
      getReferencedModel: _getModel,
    }
  )
  return p
}

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
}
