import merge from 'lodash/merge'
import get from 'lodash/get'
import {
  arrayType,
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
  ModelReferenceType,
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
  PropertyType,
  DateValueType,
  PrimitiveValueType,
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

/**
 * The base function that creates a fully loaded instance of a property. All standard issue properties use this function.
 * @param propertyType - The property's value type.
 * @param config - Configurations
 * @param additionalMetadata - Additional metadata that you want to add to a given property.
 * @typeParam TValue - The typescript value that the property produces.
 * @typeParam TData - The DataDescription that this property instance belongs to.
 * @typeParam TModelExtensions - Any additional model extensions
 * @typeParam TModelInstanceExtensions - Any additional model instance extensions
 */
const Property = <
  TValue extends Arrayable<DataValue>,
  TData extends DataDescription = DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
>(
  propertyType: PropertyType | string,
  config: PropertyConfig<TValue> = {},
  additionalMetadata = {}
): PropertyInstance<
  TValue,
  TData,
  TModelExtensions,
  TModelInstanceExtensions
> => {
  if (!propertyType && !config?.typeOverride) {
    throw new Error(`Property type must be provided.`)
  }
  if (config?.typeOverride) {
    propertyType = config.typeOverride
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

  const createGetter = (
    instanceValue: TValue,
    modelData: TData,
    instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  ): ValueGetter<TValue, TData, TModelExtensions, TModelInstanceExtensions> => {
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
      TData,
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
  }

  const getValidator = (
    valueGetter: ValueGetter<
      TValue,
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => {
    const validator = createPropertyValidator(valueGetter, config)
    const _propertyValidatorWrapper: PropertyValidator<
      TData
      // eslint-disable-next-line functional/prefer-tacit
    > = async (instanceData, propertyConfiguration) => {
      return validator(instanceData, propertyConfiguration)
    }
    return _propertyValidatorWrapper
  }

  const propertyInstance: PropertyInstance<
    TValue,
    TData,
    TModelExtensions,
    TModelInstanceExtensions
  > = {
    ...additionalMetadata,
    getConfig: () => config || {},
    getChoices,
    getDefaultValue,
    getConstantValue,
    getPropertyType: () => propertyType,
    createGetter,
    getValidator,
  }
  return propertyInstance
}

/**
 * Config object for a date property
 */
type DatePropertyConfig<T extends Arrayable<DataValue>> = {
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
} & PropertyConfig<T>

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
 * A Property for Dates. Supports both strings and Date objects.
 * This does NOT include time information.
 * @param config - A configuration that enables overriding of date formatting
 * @param additionalMetadata
 */
const DateProperty = (
  config: DatePropertyConfig<DateValueType> = {},
  additionalMetadata = {}
) =>
  Property<DateValueType>(
    PropertyType.Date,
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

/**
 * A property for Date AND Times. Supports both strings and Date Objects.
 * @param config - A configuration that enables overriding of date and time formatting
 * @param additionalMetadata
 */
const DatetimeProperty = (
  config: DatePropertyConfig<DateValueType> = {},
  additionalMetadata = {}
) =>
  Property<DateValueType>(
    PropertyType.Datetime,
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

/**
 * A property that has an array of sub values.
 * @param config
 * @param additionalMetadata
 */
const ArrayProperty = <T extends DataValue>(
  config = {},
  additionalMetadata = {}
) =>
  Property<readonly T[]>(
    PropertyType.Array,
    {
      defaultValue: [],
      ...config,
      isArray: true,
    },
    additionalMetadata
  )

/**
 * A property that is an array, but only of a single value type. This is an {@link ArrayProperty} but with a validator for the type.
 * @param valueType - The type. (Only supports primitive data types, no objects)
 * @param config
 * @param additionalMetadata
 */
const SingleTypeArrayProperty = <
  TValue extends Omit<PrimitiveValueType, 'object'>,
>(
  valueType: TValue,
  config = {},
  additionalMetadata = {}
) =>
  Property<readonly TValue[]>(
    PropertyType.Array,
    {
      defaultValue: [],
      ...config,
      isArray: true,
      validators: mergeValidators(
        config,
        // @ts-ignore
        arrayType(valueType)
      ),
    },
    additionalMetadata
  )

/**
 * A property that has simple objects. These must be JSON compliant. These are validated.
 * @param config
 * @param additionalMetadata
 */
const ObjectProperty = <TObject extends Readonly<Record<string, JsonAble>>>(
  config = {},
  additionalMetadata = {}
) =>
  Property<TObject>(
    PropertyType.Object,
    merge(config, {
      validators: mergeValidators(config, isType('object')),
    }),
    additionalMetadata
  )

/**
 * A simple text property. If it's possible to put ALOT of text in this field consider using the {@link BigTextProperty}
 * @param config - Additional Configurations
 * @param additionalMetadata - Additional Metadata
 */
const TextProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  Property<string>(
    PropertyType.Text,
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
    PropertyType.BigText,
    merge(config, {
      isString: true,
      validators: mergeValidators(config, ...getCommonTextValidators(config)),
    }),
    additionalMetadata
  )

/**
 * A property that houses integers. No floats allowed.
 * @param config
 * @param additionalMetadata
 */
const IntegerProperty = (
  config: PropertyConfig<number> = {},
  additionalMetadata = {}
) =>
  Property<number>(
    PropertyType.Integer,
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
    PropertyType.Integer,
    merge(config, {
      isInteger: true,
      validators: mergeValidators(
        config,
        ...getCommonNumberValidators(config),
        minNumber(0),
        maxNumber(MAX_YEAR)
      ),
    }),
    additionalMetadata
  )

/**
 * A property for numbers. This could be integers or float values.
 * @param config
 * @param additionalMetadata
 */
const NumberProperty = (
  config: PropertyConfig<number> = {},
  additionalMetadata = {}
) =>
  Property<number>(
    PropertyType.Number,
    merge(config, {
      isNumber: true,
      validators: mergeValidators(config, ...getCommonNumberValidators(config)),
    }),
    additionalMetadata
  )

/**
 * A property that has a fixed value that can never be changed. Can be useful for things like embedding the name of a model into JSONified objects.
 * @param valueType - The value type for this property.
 * @param value - The value to fix.
 * @param config
 * @param additionalMetadata
 */
const ConstantValueProperty = <TDataValue extends Arrayable<DataValue>>(
  valueType: PropertyType | string,
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

/**
 * A property that encapsulates email addresses. Provides validation for making sure an email is valid.
 * @param config
 * @param additionalMetadata
 */
const EmailProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  TextProperty(
    merge(config, {
      type: PropertyType.Email,
      validators: mergeValidators(config, meetsRegex(EMAIL_REGEX)),
    }),
    additionalMetadata
  )

/**
 * A property that has a true or false value.
 * @param config
 * @param additionalMetadata
 */
const BooleanProperty = (
  config: PropertyConfig<boolean> = {},
  additionalMetadata = {}
) =>
  Property<boolean>(
    PropertyType.Boolean,
    merge(config, {
      isBoolean: true,
    }),
    additionalMetadata
  )

/**
 * A property that is used for Primary Keys. If no value is provided a UUID is automatically created.
 * This property has required on it.
 * @param config - Additional configurations. NOTE: required is ALWAYS true.
 * @param additionalMetadata - Any additional metadata.
 */
const PrimaryKeyUuidProperty = (
  config: PropertyConfig<string> = {},
  additionalMetadata = {}
) =>
  Property<string>(
    PropertyType.UniqueId,
    merge(config, {
      required: true,
      isString: true,
      validators: mergeValidators(config, isValidUuid),
      lazyLoadMethod: (value: Arrayable<DataValue>) => {
        if (!value) {
          return createUuid()
        }
        return value
      },
    }),
    additionalMetadata
  )

/**
 * A property that has a reference to another model instance. A "Foreign Key" if you will.
 * For full functionality a {@link ModelInstanceFetcher} must be provided in the config.
 * This property has complex functionalities.
 *
 * When a model calls "instance.get.whatever()" to get the value of a ModelReferenceProperty, it uses the model fetcher
 * to retrieve the model. (Could be saved elsewhere, or a database). When the promise is awaited, the value returned
 * is a ModelInstance object.
 *
 * However, when `toObj()` is called on that same instance, only the primary key value is returned. This is so that
 * when you call `toObj()` on the main instance, the "foreign key" gets filled in.
 *
 * This is useful for a save function with an ORM.
 * @param model - Either the model itself or a function that creates the model when needed (lazy).
 * @param config
 * @param additionalMetadata
 */
const ModelReferenceProperty = <T extends DataDescription>(
  model: MaybeFunction<ModelType<T>>,
  config: PropertyConfig<ModelReferenceType<T>> = {},
  additionalMetadata = {}
) => AdvancedModelReferenceProperty<T>(model, config, additionalMetadata)

/**
 * The full implementation of a ModelReference, useful for typing certain extended functionalities.
 * For a full description see {@link ModelReferenceProperty}
 * @param model - A model or a function that returns the model.
 * @param config
 * @param additionalMetadata
 */
const AdvancedModelReferenceProperty = <
  T extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
>(
  model: MaybeFunction<
    ModelType<T, TModelExtensions, TModelInstanceExtensions>
  >,
  config: PropertyConfig<
    ModelReferenceType<T, TModelExtensions, TModelInstanceExtensions>
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
      instanceValues: ModelReferenceType<
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
    instanceValues: ModelReferenceType<
      T,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => {
    const valueIsModelInstance = isModelInstance(instanceValues)

    const _getInstanceReturn = (objToUse: ModelReferenceType<T>) => {
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
        return _getInstanceReturn(obj as ModelReferenceType<T>)
      }
      return null
    }
    return _getId(instanceValues)()
  }

  const p: ModelReferencePropertyInstance<
    T,
    ModelReferenceType<T, TModelExtensions, TModelInstanceExtensions>,
    TModelExtensions,
    TModelInstanceExtensions
  > = merge(
    Property<ModelReferenceType<T, TModelExtensions, TModelInstanceExtensions>>(
      PropertyType.ModelReference,
      merge({}, config, {
        validators,
        lazyLoadMethodAtomic,
      }),
      additionalMetadata
    ),
    {
      getReferencedId: (
        instanceValues: ModelReferenceType<
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
 * A property for Denormalizing. This represents a complex value that has been simplified for ease of use.
 * One common use is for creating "Display Values" in a GUI. This process can be extremely expensive, such as having to
 * get selected values 2 or 3 Foreign Keys deep.
 *
 * This property allows passing in a calculate function that will only be executed once, and only if there is no value, and then only when asked.
 *
 * To recalculate the value, you need to run the calculate function on the property itself, passing in new model data.
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
    PropertyType.Text,
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
    PropertyType.Number,
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
    PropertyType.Integer,
    calculate,
    merge(config, {
      isInteger: true,
      validators: mergeValidators(config, ...getCommonNumberValidators(config)),
    }),
    additionalMetadata
  )

/**
 * An id that is naturally formed by other properties within a model.
 * Instead of having a "globally unique" id the model is unique because the composition of values of properties.
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
    PropertyType.Text,
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
  SingleTypeArrayProperty,
}
