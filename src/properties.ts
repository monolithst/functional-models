import merge from 'lodash/merge'
import get from 'lodash/get'
import { formatDate } from 'date-fns/format'
import {
  createPropertyValidator,
  isType,
  meetsRegex,
  referenceTypeMatch,
} from './validation'
import { PROPERTY_TYPES } from './constants'
import { lazyValue } from './lazy'
import { createHeadAndTail, createUuid } from './utils'
import {
  ModelReference,
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
  PropertyValidator,
  ModelReferencePropertyInstance,
  FunctionalModel,
  JsonAble,
  PropertyModifier,
  TypedJsonObj,
  CalculateDenormalization,
} from './interfaces'
import {
  getValueForModelInstance,
  getValueForReferencedModel,
  isReferencedProperty,
  getCommonTextValidators,
  getCommonNumberValidators,
  mergeValidators,
  isModelInstance,
} from './lib'

const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

const DEFAULT_JUST_DATE_FORMAT = 'yyyy-MM-dd'

const Property = <
  TValue extends Arrayable<FunctionalValue>,
  T extends FunctionalModel = FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
>(
  type: string,
  config: PropertyConfig<TValue> = {},
  additionalMetadata = {}
): PropertyInstance<TValue, T, TModel, TModelInstance> => {
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

  const r: PropertyInstance<TValue, T, TModel, TModelInstance> = {
    ...additionalMetadata,
    getConfig: () => config || {},
    getChoices,
    getDefaultValue,
    getConstantValue,
    getPropertyType: () => type,
    createGetter: (
      instanceValue: TValue,
      modelData: T,
      instance: TModelInstance
    ): ValueGetter<TValue, T, TModel, TModelInstance> => {
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
        ? // eslint-disable-next-line no-unused-vars
          (lazyValue(lazyLoadMethod) as (
            value: TValue,
            modelData: T,
            modelInstance: TModelInstance
          ) => Promise<TValue>)
        : typeof instanceValue === 'function'
          ? (instanceValue as () => TValue)
          : () => instanceValue
      const r: ValueGetter<TValue, T, TModel, TModelInstance> = () => {
        const result = method(instanceValue, modelData, instance)
        return valueSelector(result)
      }
      return r
    },
    getValidator: (
      valueGetter: ValueGetter<TValue, T, TModel, TModelInstance>
    ) => {
      const validator = createPropertyValidator(valueGetter, config)
      const _propertyValidatorWrapper: PropertyValidator<
        T,
        TModel,
        TModelInstance
        // eslint-disable-next-line functional/prefer-tacit
      > = async (instance, instanceData, propertyConfiguration) => {
        // @ts-ignore
        return validator<TModel>(instance, instanceData, propertyConfiguration)
      }
      return _propertyValidatorWrapper
    },
  }
  return r
}

/**
 * Config object for a date property
 */
type DatePropertyConfig<T> = PropertyConfig<T> & {
  /**
   * A date-fns format.
   */
  format?: string
  isDateOnly?: boolean
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
 * @constructor
 */
const DateProperty = <TModifier extends PropertyModifier<Date | string>>(
  config: DatePropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.DateProperty,
    merge(
      {
        lazyLoadMethod: (value: Arrayable<FunctionalValue>) => {
          if (isDate(value)) {
            if (config.format) {
              return formatDate(value, config.format)
            }
            if (config.isDateOnly) {
              return formatDate(value, DEFAULT_JUST_DATE_FORMAT)
            }
            return value.toISOString()
          }
          if (!value && config?.autoNow) {
            const date = new Date()
            if (config.format) {
              return formatDate(date, config.format)
            }
            if (config.isDateOnly) {
              return formatDate(date, DEFAULT_JUST_DATE_FORMAT)
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
  TModifier extends PropertyModifier<Readonly<{ [s: string]: JsonAble }>>,
>(
  config = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.ObjectProperty,
    merge(config, {
      validators: mergeValidators(config, [isType('object')]),
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
      validators: mergeValidators(config, getCommonTextValidators(config)),
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
      validators: mergeValidators(config, getCommonNumberValidators(config)),
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
      validators: mergeValidators(config, getCommonNumberValidators(config)),
    }),
    additionalMetadata
  )

const ConstantValueProperty = <
  TModifier extends PropertyModifier<FunctionalValue>,
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
      validators: mergeValidators(config, [meetsRegex(EMAIL_REGEX)]),
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

const ModelReferenceProperty = <
  T extends FunctionalModel,
  TModifier extends PropertyModifier<ModelReference<T>> = PropertyModifier<
    ModelReference<T>
  >,
>(
  model: MaybeFunction<Model<T>>,
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  AdvancedModelReferenceProperty<
    T,
    Model<T>,
    ModelInstance<T, Model<T>>,
    TModifier
  >(model, config, additionalMetadata)

const AdvancedModelReferenceProperty = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
  TModifier extends PropertyModifier<ModelReference<T>> = PropertyModifier<
    ModelReference<T>
  >,
>(
  model: MaybeFunction<TModel>,
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

  const validator = referenceTypeMatch<T, TModel, TModelInstance>(model)
  const validators = mergeValidators(config, [
    // @ts-ignore
    validator,
  ])

  const _getId =
    (instanceValues: ModelReference<T, TModel> | TModifier) =>
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
      if ((instanceValues as TModelInstance).getPrimaryKey) {
        return (instanceValues as TModelInstance).getPrimaryKey()
      }

      const theModel = _getModel()
      const primaryKey = theModel.getPrimaryKeyName()

      return (instanceValues as TypedJsonObj<T>)[primaryKey] as PrimaryKeyType
    }

  const lazyLoadMethod = async (instanceValues: TModifier) => {
    const valueIsModelInstance = isModelInstance(instanceValues)
    const _getInstanceReturn = (objToUse: TModifier) => {
      // We need to determine if the object we just got is an actual model instance to determine if we need to make one.
      const objIsModelInstance = isModelInstance(objToUse)
      // @ts-ignore
      const instance = objIsModelInstance
        ? objToUse
        : _getModel().create(objToUse as TypedJsonObj<T>)
      // We are replacing the toObj function, because the reference type in the end should be the primary key when serialized.
      return merge({}, instance, {
        toObj: _getId(instanceValues),
      })
    }

    // @ts-ignore
    if (valueIsModelInstance) {
      return _getInstanceReturn(instanceValues)
    }

    // TypedJson?
    const theModel = _getModel()
    const primaryKey = theModel.getPrimaryKeyName()
    if (get(instanceValues, primaryKey)) {
      return _getInstanceReturn(instanceValues)
    }

    if (config?.fetcher) {
      const id = await _getId(instanceValues)()
      const model = _getModel()
      if (id !== null && id !== undefined) {
        const obj = await config.fetcher<T>(model, id)
        return _getInstanceReturn(obj as TModifier)
      }
      return null
    }
    return _getId(instanceValues)()
  }

  const p: ModelReferencePropertyInstance<
    T,
    TModifier,
    TModel,
    TModelInstance
  > = merge(
    Property<TModifier>(
      PROPERTY_TYPES.ReferenceProperty,
      merge({}, config, {
        validators,
        lazyLoadMethod,
      }),
      additionalMetadata
    ),
    {
      getReferencedId: (instanceValues: ModelReference<T, TModel>) =>
        _getId(instanceValues)(),
      getReferencedModel: _getModel,
    }
  )
  return p
}

/**
 * A property for denormalizing values.
 * @param propertyType
 * @param calculate
 * @param config
 * @param additionalMetadata
 * @constructor
 */
const DenormalizedProperty = <
  T extends FunctionalValue,
  TModel extends FunctionalModel,
>(
  propertyType: string,
  calculate: CalculateDenormalization<T, TModel>,
  config: PropertyConfig<T> = {},
  additionalMetadata = {}
) => {
  const property = Property<T>(
    propertyType,
    merge(config, {
      isDenormalized: true,
      lazyLoadMethod: async (
        value: string | undefined,
        modelData: TModel,
        modelInstance: ModelInstance<TModel, any>
      ) => {
        console.log('I AM HERE')
        console.log(value)
        if (value !== undefined) {
          return value
        }
        return calculate(modelData)
      },
    }),
    additionalMetadata
  )
  return merge(property, {
    calculate,
  })
}

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
 * @constructor
 */
const NaturalIdProperty = <TModifier extends PropertyModifier<string>>(
  propertyKeys: readonly string[],
  joiner: string,
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  Property<TModifier>(
    PROPERTY_TYPES.TextProperty,
    merge(config, {
      isString: true,
      validators: mergeValidators(config, getCommonTextValidators(config)),
      lazyLoadMethod: async (
        value: string | undefined,
        model: FunctionalModel,
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

// We are adding this here to normalize the name, while maintaining backwards compatability.
const UniqueIdProperty = UniqueId

export {
  Property,
  NaturalIdProperty,
  UniqueId,
  UniqueIdProperty,
  DateProperty,
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
}
