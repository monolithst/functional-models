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
import { toTitleCase, createUuid } from './utils'
import {
  ReferenceValueType,
  FunctionalObj,
  IModelInstance,
  IModel,
  IPropertyInstance,
  FunctionalType,
  IPropertyConfig,
  IValueGetter,
  MaybeFunction,
  Maybe,
  Arrayable,
  IPropertyValidatorComponent, IPropertyValidator,
  IReferenceProperty, CreateInstanceInput,
  FunctionalModel,
} from './interfaces'

const createPropertyTitle = (key: string) => {
  const goodName = toTitleCase(key)
  return `get${goodName}`
}

const EMAIL_REGEX =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/u

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

function Property<T extends Arrayable<FunctionalType>>(type: string, config : IPropertyConfig = {}, additionalMetadata = {}) {
  if (!type && !config?.type) {
    throw new Error(`Property type must be provided.`)
  }
  if (config?.type) {
    type = config.type
  }
  const getConstantValue = () => (config?.value !== undefined ? config?.value : undefined) as T
  const getDefaultValue = () => (config?.defaultValue !== undefined ? config?.defaultValue : undefined) as T
  const getChoices = () => config?.choices ? config?.choices : []
  const lazyLoadMethod = config?.lazyLoadMethod || false
  const valueSelector = config?.valueSelector || identity
  if (typeof valueSelector !== 'function') {
    throw new Error(`valueSelector must be a function`)
  }


  const r : IPropertyInstance<T> = {
    ...additionalMetadata,
    getConfig: () => config || {},
    getChoices,
    getDefaultValue,
    getConstantValue,
    getPropertyType: () => type,
    createGetter: (instanceValue: T) : IValueGetter => {
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
        // eslint-disable-next-line no-unused-vars
        ? lazyValue(lazyLoadMethod) as ((value: T) => Promise<T>)
        : typeof instanceValue === 'function'
          ? instanceValue as () => T
          : () => instanceValue
      return () => {
        return valueSelector(method(instanceValue))
      }
    },
    getValidator: valueGetter => {
      const validator = createPropertyValidator(valueGetter, config)
      const _propertyValidatorWrapper : IPropertyValidator = async (instance, instanceData) => {
        return validator(instance, instanceData)
      }
      return _propertyValidatorWrapper
    },
  }
  return r
}

const DateProperty = (config: IPropertyConfig={}, additionalMetadata={}) => Property<Maybe<Date>>(PROPERTY_TYPES.DateProperty, merge(
  {
    lazyLoadMethod: (value: Arrayable<FunctionalType>) => {
      if (!value && config?.autoNow) {
        return new Date()
      }
      return value
    },
  },
  config
),
additionalMetadata)


const ReferenceProperty = <T extends FunctionalModel>(model: MaybeFunction<IModel<T>>, config : IPropertyConfig={}, additionalMetadata={}) => {
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

  const _getId = (instanceValues: ReferenceValueType<T>) => (): string | null | undefined => {
    if (!instanceValues) {
      return null
    }
    if (typeof instanceValues === 'string') {
      return instanceValues
    }
    if ((instanceValues as IModelInstance<T>).getPrimaryKey) {
      return (instanceValues as IModelInstance<T>).getPrimaryKey()
    }

    const theModel = _getModel()
    const primaryKey = theModel.getPrimaryKeyName()

    // @ts-ignore
    const id = (instanceValues as CreateInstanceInput<T>)[primaryKey]
    if (typeof id === 'string') {
      return id
    }
    throw new Error(`Unexpectedly no key to return.`)
  }

  const lazyLoadMethod = async (instanceValues: ReferenceValueType<T>) => {
    const valueIsModelInstance = instanceValues && (instanceValues as IModelInstance<T>).getPrimaryKey
    const _getInstanceReturn = (objToUse: ReferenceValueType<T>) => {
      // We need to determine if the object we just go is an actual model instance to determine if we need to make one.
      const objIsModelInstance = instanceValues && (instanceValues as IModelInstance<T>).getPrimaryKey

      const instance = objIsModelInstance
        ? objToUse
        : _getModel().create(objToUse as CreateInstanceInput<T>)
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

  const p: IReferenceProperty<T> = merge(
    Property <IModelInstance<T>|T|string|null> (
        PROPERTY_TYPES.ReferenceProperty,
          merge({}, config, {
            validators,
            lazyLoadMethod,
          }),
      additionalMetadata,
      ), {
    getReferencedId: (instanceValues: ReferenceValueType<T>) => _getId(instanceValues)(),
    getReferencedModel: _getModel,
  })
  return p
}

const ArrayProperty = <T extends FunctionalType>(config = {}, additionalMetadata={}) =>
  Property<readonly T[]>(
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

const TextProperty = (config: IPropertyConfig={}, additionalMetadata={} ) =>
  Property<string|null>(
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

const IntegerProperty = (config : IPropertyConfig={}, additionalMetadata={}) =>
  Property(
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

const NumberProperty = (config : IPropertyConfig={}, additionalMetadata={}) =>
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

const ConstantValueProperty = (value: string, config: IPropertyConfig={}, additionalMetadata={}) =>
  TextProperty(
    merge(config, {
      type: PROPERTY_TYPES.ConstantValueProperty,
      value,
    }),
    additionalMetadata
  )

const EmailProperty = (config: IPropertyConfig={}, additionalMetadata={}) =>
  TextProperty(
    merge(config, {
      type: PROPERTY_TYPES.EmailProperty,
      validators: _mergeValidators(config, [meetsRegex(EMAIL_REGEX)]),
    }),
    additionalMetadata
  )

const BooleanProperty = (config: IPropertyConfig={}, additionalMetadata={}) => Property<boolean>(
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

const UniqueId = (config: IPropertyConfig={}, additionalMetadata={}) =>
  Property<string>(
    PROPERTY_TYPES.UniqueId,
    merge({
      lazyLoadMethod: (value: Arrayable<FunctionalType>) => {
        if (!value) {
          return createUuid()
        }
        return value
      },
    }, config),
  additionalMetadata
  )


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
