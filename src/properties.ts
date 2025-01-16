import merge from 'lodash/merge'
import get from 'lodash/get'
import {
  createPropertyValidator,
  isType,
  isValidUuid,
  maxNumber,
  meetsRegex,
  minNumber,
  referenceTypeMatch,
} from './validation'
import {
  createHeadAndTail,
  createUuid,
  memoizeAsync,
  memoizeSync,
} from './utils'
import {
  ModelReference,
  ModelInstance,
  Maybe,
  PrimaryKeyType,
  ModelType,
  PropertyInstance,
  DataValue,
  PropertyConfig,
  ValueGetter,
  MaybeFunction,
  Arrayable,
  PropertyValidator,
  ModelReferencePropertyInstance,
  DataDescription,
  JsonAble,
  JsonifiedData,
  CalculateDenormalization,
  ValueType,
  DateValueType,
} from './types'
import {
  getValueForModelInstance,
  getValueForReferencedModel,
  isReferencedProperty,
  getCommonTextValidators,
  getCommonNumberValidators,
  mergeValidators,
  isModelInstance,
} from './lib'

const MAX_YEAR = 3000
const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

const Property = <
  TValue extends Arrayable<DataValue>,
  T extends DataDescription = DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
>(
  type: string,
  config: PropertyConfig<TValue> = {},
  additionalMetadata = {}
): PropertyInstance<TValue, T, TModelExtensions, TModelInstanceExtensions> => {
  if (!type && !config?.type) {
    throw new Error(`Property type must be provided.`)
  }
  if (config?.type) {
    type = config.type
  }
  const getConstantValue = () =>
    (config?.value !== undefined ? config.value : undefined) as TValue
  const getDefaultValue = () =>
    (config?.defaultValue !== undefined
      ? config.defaultValue
      : undefined) as TValue
  const getChoices = () => config?.choices || []
  const lazyLoadMethod = config?.lazyLoadMethod || false
  const valueSelector = config?.valueSelector || (x => x)
  if (typeof valueSelector !== 'function') {
    throw new Error(`valueSelector must be a function`)
  }

  const propertyInstance: PropertyInstance<
    TValue,
    T,
    TModelExtensions,
    TModelInstanceExtensions
  > = {
    ...additionalMetadata,
    getConfig: () => config || {},
    getChoices,
    getDefaultValue,
    getConstantValue,
    getPropertyType: () => type,
    createGetter: (
      instanceValue: TValue,
      modelData: T,
      instance: ModelInstance<T, TModelExtensions, TModelInstanceExtensions>
    ): ValueGetter<TValue, T, TModelExtensions, TModelInstanceExtensions> => {
      const constantValue = getConstantValue()
      if (constantValue !== undefined) {
        return () => constantValue
      }
      const defaultValue = getDefaultValue()
      if (
        defaultValue !== undefined &&
        (instanceValue === null || instanceValue === undefined)
      ) {
        return () => defaultValue
      }

      const method = lazyLoadMethod
        ? lazyLoadMethod
        : config.lazyLoadMethodAtomic
          ? memoizeAsync(config.lazyLoadMethodAtomic)
          : typeof instanceValue === 'function'
            ? (instanceValue as () => TValue)
            : () => instanceValue
      const valueGetter: ValueGetter<
        TValue,
        T,
        TModelExtensions,
        TModelInstanceExtensions
      > = memoizeSync(() => {
        // @ts-ignore
        const result: TValue | Promise<TValue> = method(
          instanceValue,
          modelData,
          // @ts-ignore
          instance
        )
        return valueSelector(result)
      })
      return valueGetter
    },
    getValidator: (
      valueGetter: ValueGetter<
        TValue,
        T,
        TModelExtensions,
        TModelInstanceExtensions
      >
    ) => {
      const validator = createPropertyValidator(valueGetter, config)
      const _propertyValidatorWrapper: PropertyValidator<
        T
        // eslint-disable-next-line functional/prefer-tacit
      > = async (instanceData, propertyConfiguration) => {
        return validator(instanceData, propertyConfiguration)
      }
      return _propertyValidatorWrapper
    },
  }
  return propertyInstance
}

/**
 * Config object for a date property
 */
type DatePropertyConfig<T extends Arrayable<DataValue>> = PropertyConfig<T> & {
  /**
   * A function that can format the date into a string.
   * Can use date-fns, moment, or any other function.
   * @param date - The date will be a date object
   * @param format - The format property passed in if provided.
   */
  formatFunction?: (date: Date, format?: string) => string
  /**
   * The format the date should be in. This is a framework agnostic format, and should be based on your format function.
   * NOTE: If a formatFunction is not provided, this is completely ignored. For dates YYYY/MM/DD is the default and for Datetimes it is ISOString()
   */
  format?: string
}

/**
 * Determines if the value is a Date object.
 * @param value Any value
 */
const isDate = (value: any): value is Date => {
  if (value === null) {
    return false
  }
  return typeof value === 'object' && value.toISOString
}

/**
 * A Property for Dates. Both strings and Date objects.
 * @param config
 * @param additionalMetadata
 */
const DateProperty = (
  config: DatePropertyConfig<DateValueType> = {},
  additionalMetadata = {}
) =>
  Property<DateValueType>(
    ValueType.Date,
    merge(
      {
        lazyLoadMethod: (value: Arrayable<DataValue>) => {
          if (isDate(value)) {
            if (config.formatFunction) {
              return config.formatFunction(value, config.format)
            }
            return value.toISOString().split('T')[0]
          }
          if (!value && config?.autoNow) {
            const date = new Date()
            if (config.formatFunction) {
              return config.formatFunction(date, config.format)
            }
            return date.toISOString().split('T')[0]
          }
          return value
        },
      },
      config
    ),
    additionalMetadata
  )

const DatetimeProperty = (
  config: DatePropertyConfig<DateValueType> = {},
  additionalMetadata = {}
) =>
  Property<DateValueType>(
    ValueType.Datetime,
    merge(
      {
        lazyLoadMethod: (value: Arrayable<DataValue>) => {
          if (isDate(value)) {
            if (config.formatFunction) {
              return config.formatFunction(value, config.format)
            }
            return value.toISOString()
          }
          if (!value && config?.autoNow) {
            const date = new Date()
            if (config.formatFunction) {
              return config.formatFunction(date, config.format)
            }
            return date.toISOString()
          }
          return value
        },
      },
      config
    ),
    additionalMetadata
  )

const ArrayProperty = <T extends DataValue>(
  config = {},
  additionalMetadata = {}
) =>
  Property<readonly T[]>(
    ValueType.Array,
    {
      defaultValue: [],
      ...config,
      isArray: true,
    },
    additionalMetadata
  )

const ObjectProperty = <TModifier extends Readonly<Record<string, JsonAble>>>(
  config = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    ValueType.Object,
    merge(config, {
      validators: mergeValidators(config, isType('object')),
    }),
    additionalMetadata
  )

/**
 * A simple text property. If its possible to put ALOT of text in this field consider using the {@link BigTextProperty}
 * @param config - Additional Configurations
 * @param additionalMetadata - Additional Metadata
 */
const TextProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  Property<string>(
    ValueType.Text,
    merge(config, {
      isString: true,
      validators: mergeValidators(config, ...getCommonTextValidators(config)),
    }),
    additionalMetadata
  )

/**
 * A property for large blocks of strings.
 * @param config - Additional configurations
 * @param additionalMetadata - Additional metadata
 */
const BigTextProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  Property<string>(
    ValueType.BigText,
    merge(config, {
      isString: true,
      validators: mergeValidators(config, ...getCommonTextValidators(config)),
    }),
    additionalMetadata
  )

const IntegerProperty = (
  config: PropertyConfig<number> = {},
  additionalMetadata = {}
) =>
  Property<number>(
    ValueType.Integer,
    merge(config, {
      isInteger: true,
      validators: mergeValidators(config, ...getCommonNumberValidators(config)),
    }),
    additionalMetadata
  )

/**
 * An integer property that represents a year. NOTE: This is exclusively focused on a year in a modern context.
 * Validates from 0 to 3000
 * @param config
 * @param additionalMetadata
 */
const YearProperty = (
  config: PropertyConfig<number> = {},
  additionalMetadata = {}
) =>
  Property<number>(
    ValueType.Integer,
    merge(config, {
      isInteger: true,
      validators: mergeValidators(config, ...getCommonNumberValidators(config)),
    }),
    additionalMetadata
  )

const NumberProperty = (
  config: PropertyConfig<number> = {},
  additionalMetadata = {}
) =>
  Property<number>(
    ValueType.Number,
    merge(config, {
      isNumber: true,
      validators: mergeValidators(
        config,
        ...getCommonNumberValidators(config),
        minNumber(0),
        maxNumber(MAX_YEAR)
      ),
    }),
    additionalMetadata
  )

const ConstantValueProperty = <TDataValue extends Arrayable<DataValue>>(
  valueType: ValueType,
  value: TDataValue,
  config: PropertyConfig<TDataValue> = {},
  additionalMetadata = {}
) =>
  Property<TDataValue>(
    valueType,
    merge(config, {
      value,
    }),
    additionalMetadata
  )

const EmailProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  TextProperty(
    merge(config, {
      type: ValueType.Email,
      validators: mergeValidators(config, meetsRegex(EMAIL_REGEX)),
    }),
    additionalMetadata
  )

const BooleanProperty = (
  config: PropertyConfig<boolean> = {},
  additionalMetadata = {}
) =>
  Property<boolean>(
    ValueType.Boolean,
    merge(config, {
      isBoolean: true,
    }),
    additionalMetadata
  )

/**
 * A property that creates and represents uuids. Equipped with a validator and automatically generates if not provided.
 * @param config - Additional configurations. If you want to use this for primary keys look at {@link PrimaryKeyUuidProperty}
 * @param additionalMetadata - Any additional metadata.
 */
const UniqueIdProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  Property<string>(
    ValueType.UniqueId,
    merge(
      {
        isString: true,
        validators: mergeValidators(config, isValidUuid),
        lazyLoadMethod: (value: Arrayable<DataValue>) => {
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

/**
 * A UniqueIdProperty that is used for Primary Keys. This adds the required: true that is so common.
 * @param config - Additional configurations. NOTE: required is ALWAYS true.
 * @param additionalMetadata - Any additional metadata.
 */
const PrimaryKeyUuidProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) => UniqueIdProperty(merge(config, { required: true }, additionalMetadata))

const ModelReferenceProperty = <T extends DataDescription>(
  model: MaybeFunction<ModelType<T>>,
  config: PropertyConfig<ModelReference<T>> = {},
  additionalMetadata = {}
) => AdvancedModelReferenceProperty<T>(model, config, additionalMetadata)

const AdvancedModelReferenceProperty = <
  T extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
>(
  model: MaybeFunction<
    ModelType<T, TModelExtensions, TModelInstanceExtensions>
  >,
  config: PropertyConfig<
    ModelReference<T, TModelExtensions, TModelInstanceExtensions>
  > = {},
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

  // @ts-ignore
  const validator = referenceTypeMatch(model)
  const validators = mergeValidators(config, validator)

  const _getId =
    (
      instanceValues: ModelReference<
        T,
        ModelType<T, TModelExtensions, TModelInstanceExtensions>
      >
    ) =>
    (): Maybe<PrimaryKeyType> => {
      if (!instanceValues) {
        return undefined
      }
      if (typeof instanceValues === 'number') {
        return instanceValues
      }
      if (typeof instanceValues === 'string') {
        return instanceValues
      }
      if (
        (
          instanceValues as ModelInstance<
            T,
            TModelExtensions,
            TModelInstanceExtensions
          >
        ).getPrimaryKey
      ) {
        return (
          instanceValues as ModelInstance<
            T,
            TModelExtensions,
            TModelInstanceExtensions
          >
        ).getPrimaryKey()
      }

      const theModel = _getModel()
      const primaryKey = theModel.getModelDefinition().primaryKeyName

      // @ts-ignore
      return (instanceValues as JsonifiedData<T>)[primaryKey] as PrimaryKeyType
    }

  const lazyLoadMethodAtomic = async (
    instanceValues: ModelReference<
      T,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => {
    const valueIsModelInstance = isModelInstance(instanceValues)

    const _getInstanceReturn = (objToUse: ModelReference<T>) => {
      // We need to determine if the object we just got is an actual model instance to determine if we need to make one.
      const objIsModelInstance = isModelInstance(objToUse)
      const instance = objIsModelInstance
        ? objToUse
        : // @ts-ignore
          _getModel().create(objToUse as JsonifiedData<T>)
      // We are replacing the toObj function, because the reference type in the end should be the primary key when serialized.
      return merge({}, instance, {
        toObj: memoizeAsync(_getId(instanceValues)),
      })
    }

    // @ts-ignore
    if (valueIsModelInstance) {
      return _getInstanceReturn(instanceValues)
    }

    // TypedJson?
    const theModel = _getModel()
    const primaryKey = theModel.getModelDefinition().primaryKeyName
    if (get(instanceValues, primaryKey)) {
      return _getInstanceReturn(instanceValues)
    }

    if (config?.fetcher) {
      const id = await _getId(instanceValues)()
      const model = _getModel()
      if (id !== null && id !== undefined) {
        const obj = await config.fetcher(model, id)
        return _getInstanceReturn(obj as ModelReference<T>)
      }
      return null
    }
    return _getId(instanceValues)()
  }

  const p: ModelReferencePropertyInstance<
    T,
    ModelReference<T, TModelExtensions, TModelInstanceExtensions>,
    TModelExtensions,
    TModelInstanceExtensions
  > = merge(
    Property<ModelReference<T, TModelExtensions, TModelInstanceExtensions>>(
      ValueType.Reference,
      merge({}, config, {
        validators,
        lazyLoadMethodAtomic,
      }),
      additionalMetadata
    ),
    {
      getReferencedId: (
        instanceValues: ModelReference<
          T,
          ModelType<T, TModelExtensions, TModelInstanceExtensions>
        >
      ) => _getId(instanceValues)(),
      getReferencedModel: _getModel,
    }
  )
  return p
}

/**
 * A property for denormalizing values.
 * @param propertyType - A property type.
 * @param calculate - A function for calculating the denormalized value.
 * @param config - A Config
 * @param additionalMetadata _ Any additional metadata.
 */
const DenormalizedProperty = <
  TValue extends DataValue,
  T extends DataDescription,
>(
  propertyType: string,
  calculate: CalculateDenormalization<TValue, T>,
  config: PropertyConfig<TValue> = {},
  additionalMetadata = {}
) => {
  const property = Property<TValue>(
    propertyType,
    merge(config, {
      isDenormalized: true,
      lazyLoadMethodAtomic: async (
        value: string | undefined,
        modelData: T,
        modelInstance: ModelInstance<T, any>
      ) => {
        if (value !== undefined) {
          return value
        }
        return calculate(modelData, modelInstance)
      },
    }),
    additionalMetadata
  )
  return merge(property, {
    calculate,
  })
}

/**
 * A Denormalized Property that is for text.
 * @param calculate - A function that can get a string
 * @param config - Any configs
 * @param additionalMetadata - Optional Metadata
 */
const DenormalizedTextProperty = <T extends DataDescription>(
  calculate: CalculateDenormalization<string, T>,
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  DenormalizedProperty<string, T>(
    ValueType.Text,
    calculate,
    merge(config, {
      isString: true,
      validators: mergeValidators(config, ...getCommonTextValidators(config)),
    }),
    additionalMetadata
  )

/**
 * A Denormalized Property that is for numbers.
 * @param calculate - A function that can get a string
 * @param config - Any configs
 * @param additionalMetadata - Optional Metadata
 */
const DenormalizedNumberProperty = <T extends DataDescription>(
  calculate: CalculateDenormalization<number, T>,
  config: PropertyConfig<number> = {},
  additionalMetadata = {}
) =>
  DenormalizedProperty<number, T>(
    ValueType.Number,
    calculate,
    merge(config, {
      isNumber: true,
      validators: mergeValidators(config, ...getCommonNumberValidators(config)),
    }),
    additionalMetadata
  )

/**
 * A Denormalized Property that is for integers.
 * @param calculate - A function that can get a string
 * @param config - Any configs
 * @param additionalMetadata - Optional Metadata
 */
const DenormalizedIntegerProperty = <T extends DataDescription>(
  calculate: CalculateDenormalization<number, T>,
  config: PropertyConfig<number> = {},
  additionalMetadata = {}
) =>
  DenormalizedProperty<number, T>(
    ValueType.Integer,
    calculate,
    merge(config, {
      isInteger: true,
      validators: mergeValidators(config, ...getCommonNumberValidators(config)),
    }),
    additionalMetadata
  )

/**
 * An Id that is naturally formed by the other properties within a model.
 * Instead of having a "globally unique" id the model is unique because
 * the composition of values of properties.
 * @param propertyKeys A list (in order) of property keys needed to make the id. These keys can take nested paths
 * if a property is an object, array, or even a model instance object. Example: 'nested.path.here'.
 * Note: If ANY of the properties are undefined, the key becomes undefined. This is to ensure key structure integrity.
 * Additionally, if the property key points to a referenced model 1 of 2 things will happen.
 * 1. If the key is not nested (Example: model.myReferenceObj) then the key to the referenced model will be used.
 * 2. If the key IS nested (Example: model.myReferenceObj.name) then the instance will be retrieved and then the
 * property for that model instance is used.
 * @param joiner A string that will be passed to ".join()" for creating a single string.
 * @param config
 * @param additionalMetadata
 */
const NaturalIdProperty = (
  propertyKeys: readonly string[],
  joiner: string,
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  Property<string>(
    ValueType.Text,
    merge(config, {
      isString: true,
      validators: mergeValidators(config, ...getCommonTextValidators(config)),
      lazyLoadMethodAtomic: async (
        value: string | undefined,
        model: DataDescription,
        modelInstance: ModelInstance<any>
      ) => {
        const data = await propertyKeys.reduce(async (accP, key) => {
          const acc = await accP
          const [head] = createHeadAndTail(key.split('.'), '.')
          const value = await (isReferencedProperty(modelInstance, head)
            ? getValueForReferencedModel(modelInstance, key)
            : getValueForModelInstance(modelInstance, key))
          return acc.concat(value)
        }, Promise.resolve([]))
        // If any of these values are not set, we do not want to have a value at all.
        if (data.some(value => value === undefined)) {
          return undefined
        }
        return data.join(joiner)
      },
    }),
    additionalMetadata
  )

export {
  Property,
  NaturalIdProperty,
  UniqueIdProperty,
  DateProperty,
  DatetimeProperty,
  ArrayProperty,
  ModelReferenceProperty,
  AdvancedModelReferenceProperty,
  IntegerProperty,
  TextProperty,
  ConstantValueProperty,
  NumberProperty,
  ObjectProperty,
  EmailProperty,
  BooleanProperty,
  DenormalizedProperty,
  DenormalizedIntegerProperty,
  DenormalizedNumberProperty,
  DenormalizedTextProperty,
  BigTextProperty,
  YearProperty,
  PrimaryKeyUuidProperty,
}
