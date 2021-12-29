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
  Maybe,
  PrimaryKeyType,
  Model,
  PropertyInstance,
  FunctionalValue,
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
  PropertyModifier,
} from './interfaces'

const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

const _getValidatorFromConfigElseEmpty = <
  T extends FunctionalModel,
  TValue extends FunctionalValue
>(
  input: TValue | undefined,
  // eslint-disable-next-line no-unused-vars
  validatorGetter: (t: TValue) => PropertyValidatorComponent<T>
) => {
  if (input !== undefined) {
    const validator = validatorGetter(input)
    return validator
  }
  return emptyValidator
}

const _mergeValidators = <T extends Arrayable<FunctionalValue>>(
  config: PropertyConfig<T> | undefined,
  validators: readonly PropertyValidatorComponent<any>[]
) => {
  return [...validators, ...(config?.validators ? config.validators : [])]
}

const Property = <T extends Arrayable<FunctionalValue>>(
  type: string,
  config: PropertyConfig<T> = {},
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
  const valueSelector = config?.valueSelector || (x => x)
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
    createGetter: (instanceValue: T): ValueGetter<T> => {
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
      const r: ValueGetter<T> = () => {
        const result = method(instanceValue)
        return valueSelector(result)
      }
      return r
    },
    getValidator: <TModel extends FunctionalModel>(
      valueGetter: ValueGetter<T>
    ) => {
      const validator = createPropertyValidator(valueGetter, config)
      const _propertyValidatorWrapper: PropertyValidator<TModel> = async (
        instance,
        instanceData,
        propertyConfiguration
      ) => {
        return validator<TModel>(instance, instanceData, propertyConfiguration)
      }
      return _propertyValidatorWrapper
    },
  }
  return r
}

const DateProperty = <TModifier extends PropertyModifier<Date | string>>(
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.DateProperty,
    merge(
      {
        lazyLoadMethod: (value: Arrayable<FunctionalValue>) => {
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

const ArrayProperty = <T extends FunctionalValue>(
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

const ObjectProperty = <
  TModifier extends PropertyModifier<{ readonly [s: string]: JsonAble }>
>(
  config = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.ObjectProperty,
    merge(config, {
      validators: _mergeValidators(config, [isType('object')]),
    }),
    additionalMetadata
  )

const TextProperty = <TModifier extends PropertyModifier<string>>(
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
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

const IntegerProperty = <TModifier extends PropertyModifier<number>>(
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
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

const NumberProperty = <TModifier extends PropertyModifier<number>>(
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
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

const ConstantValueProperty = <
  TModifier extends PropertyModifier<FunctionalValue>
>(
  value: TModifier,
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.ConstantValueProperty,
    merge(config, {
      value,
    }),
    additionalMetadata
  )

const EmailProperty = <TModifier extends PropertyModifier<string>>(
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  TextProperty<TModifier>(
    merge(config, {
      type: PROPERTY_TYPES.EmailProperty,
      validators: _mergeValidators(config, [meetsRegex(EMAIL_REGEX)]),
    }),
    additionalMetadata
  )

const BooleanProperty = <TModifier extends PropertyModifier<boolean>>(
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.BooleanProperty,
    merge(config, {
      isBoolean: true,
    }),
    additionalMetadata
  )

const UniqueId = <TModifier extends PropertyModifier<string>>(
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.UniqueId,
    merge(
      {
        lazyLoadMethod: (value: Arrayable<FunctionalValue>) => {
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

const ReferenceProperty = <
  T extends FunctionalModel,
  TModifier extends PropertyModifier<ReferenceValueType<T>>
>(
  model: MaybeFunction<Model<T>>,
  config: PropertyConfig<TModifier> = {},
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
    (instanceValues: ReferenceValueType<T> | TModifier) =>
    (): Maybe<PrimaryKeyType> => {
      if (!instanceValues) {
        return null
      }
      if (typeof instanceValues === 'number') {
        return instanceValues
      }
      if (typeof instanceValues === 'string') {
        return instanceValues
      }
      if ((instanceValues as ModelInstance<T, any>).getPrimaryKey) {
        return (instanceValues as ModelInstance<T, any>).getPrimaryKey()
      }

      const theModel = _getModel()
      const primaryKey = theModel.getPrimaryKeyName()

      // @ts-ignore
      return (instanceValues as ModelInstanceInputData<T>)[
        primaryKey
      ] as PrimaryKeyType
    }

  const lazyLoadMethod = async (instanceValues: TModifier) => {
    const valueIsModelInstance =
      instanceValues &&
      (instanceValues as ModelInstance<T, any>).getPrimaryKeyName
    const _getInstanceReturn = (objToUse: TModifier) => {
      // We need to determine if the object we just got is an actual model instance to determine if we need to make one.
      const objIsModelInstance =
        instanceValues &&
        (instanceValues as ModelInstance<T, any>).getPrimaryKeyName

      // @ts-ignore
      const instance = objIsModelInstance
        ? objToUse
        : _getModel().create(objToUse as ModelInstanceInputData<T, any>)
      // We are replacing the toObj function, because the reference type in the end should be the primary key when serialized.
      return merge({}, instance, {
        toObj: _getId(instanceValues),
      })
    }

    // @ts-ignore
    if (valueIsModelInstance) {
      return _getInstanceReturn(instanceValues)
    }
    if (config?.fetcher) {
      const id = await _getId(instanceValues)()
      const model = _getModel()
      if (id !== null && id !== undefined) {
        const obj = await config.fetcher(model, id)
        return _getInstanceReturn(obj as TModifier)
      }
      return null
    }
    return _getId(instanceValues)()
  }

  const p: ReferencePropertyInstance<T, TModifier> = merge(
    Property<TModifier>(
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
