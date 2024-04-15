import merge from 'lodash/merge'
import {
  createPropertyValidator,
  isType,
  referenceTypeMatch,
  meetsRegex,
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
  ModelInstanceInputData,
  FunctionalModel,
  JsonAble,
  PropertyModifier,
  PropertyValidatorComponentTypeAdvanced,
} from './interfaces'
import {
  isModelInstance,
  getValueForModelInstance,
  getValueForReferencedModel,
  isReferencedProperty,
  getCommonTextValidators,
  getCommonNumberValidators,
  mergeValidators,
} from './lib'

const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

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
      // eslint-disable-next-line functional/prefer-tacit
      const _propertyValidatorWrapper: PropertyValidator<TModel> = async (
        instance,
        instanceData,
        propertyConfiguration
      ) => {
        // @ts-ignore
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
  TModifier extends PropertyModifier<
    ModelReference<T, Model<T>, ModelInstance<T, Model<T>>>
  > = ModelReference<T, Model<T>, ModelInstance<T, Model<T>>>,
>(
  model: MaybeFunction<Model<T>>,
  config: PropertyConfig<TModifier> = {},
  additionalMetadata = {}
) =>
  AdvancedModelReferenceProperty<T, Model<T>, ModelInstance<T>, TModifier>(
    model,
    config,
    additionalMetadata
  )

const AdvancedModelReferenceProperty = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
  TModifier extends PropertyModifier<
    ModelReference<T, TModel, TModelInstance>
  > = ModelReference<T, TModel, TModelInstance>,
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

  const validators = mergeValidators(config, [
    referenceTypeMatch<T>(model),
  ] as PropertyValidatorComponentTypeAdvanced<any, any>[])

  const _getId =
    (instanceValues: ModelReference<T, TModel, TModelInstance> | TModifier) =>
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

      // @ts-ignore
      return (instanceValues as ModelInstanceInputData<T>)[
        primaryKey
      ] as PrimaryKeyType
    }

  const lazyLoadMethod = async (instanceValues: TModifier) => {
    const valueIsModelInstance = isModelInstance(instanceValues)
    const _getInstanceReturn = (objToUse: TModifier) => {
      // We need to determine if the object we just got is an actual model instance to determine if we need to make one.
      const objIsModelInstance =
        objToUse && (objToUse as TModelInstance).getPrimaryKeyName
      // @ts-ignore
      const instance = objIsModelInstance
        ? objToUse
        : _getModel().create(objToUse as ModelInstanceInputData<T>)
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
      getReferencedId: (
        instanceValues: ModelReference<T, TModel, TModelInstance>
      ) => _getId(instanceValues)(),
      getReferencedModel: _getModel,
    }
  )
  return p
}

/**
 * An Id that is naturally formed by the other properties within a model.
 * Instead of a unique id because "globally unique" the model is unique because
 * the composition of values of properties
 * @param propertyKeys A list (in order) of property keys needed to make the id. These keys can take nested paths
 * if a property is an object, array, or even a model instance object. Example: 'nested.path.here'.
 * Note: If ANY of the properties are undefined an exception is thrown.
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
          if (value === undefined) {
            throw new Error(`${key} was undefined but cannot be.`)
          }

          return acc.concat(value)
        }, Promise.resolve([]))
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
}
