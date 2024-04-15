import get from 'lodash/get'
import {
  Arrayable,
  FunctionalModel,
  FunctionalValue,
  Model,
  ModelInstance,
  ModelReference,
  PrimaryKeyType,
  PropertyConfig,
  PropertyModifier,
  PropertyValidatorComponent,
} from './interfaces'
import { createHeadAndTail } from './utils'
import {
  emptyValidator,
  maxNumber,
  maxTextLength,
  minNumber,
  minTextLength,
} from './validation'

const isModelInstance = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
  TModifier extends PropertyModifier<
    ModelReference<T, TModel, TModelInstance>
  > = ModelReference<T, TModel, TModelInstance>,
>(
  instanceValues: TModifier
): boolean => {
  return Boolean(
    instanceValues && (instanceValues as TModelInstance).getPrimaryKeyName
  )
}

const getValueForReferencedModel = async (
  modelInstance: ModelInstance<any>,
  path: string
): Promise<PrimaryKeyType | any> => {
  const [head, tail] = createHeadAndTail(path.split('.'), '.')
  // If there are no nested keys, just return the reference id.
  if (!tail) {
    return modelInstance.references[head]()
  }
  const modelReference = await modelInstance.get[head]()
  if (typeof modelReference !== 'object') {
    throw new Error(
      `Value was not an object type. Likely fetcher was not provided to get referenced model instance.`
    )
  }
  const [nestedHead, nestedTail] = createHeadAndTail(tail.split('.'), '.')
  const nestedValue = await modelReference.get[nestedHead]()
  return nestedTail ? get(nestedValue, nestedTail) : nestedValue
}

const getValueForModelInstance = async (
  modelInstance: ModelInstance<any>,
  path: string
): Promise<PrimaryKeyType | any> => {
  const [head, tail] = createHeadAndTail(path.split('.'), '.')
  const value = await modelInstance.get[head]()
  return tail ? get(value, tail) : value
}

const isReferencedProperty = (
  modelInstance: ModelInstance<any>,
  key: string
) => {
  return modelInstance.references[key]
}

const getCommonTextValidators = <TModifier extends PropertyModifier<string>>(
  config: PropertyConfig<TModifier>
) => {
  return [
    getValidatorFromConfigElseEmpty(config?.maxLength, maxTextLength),
    getValidatorFromConfigElseEmpty(config?.minLength, minTextLength),
  ]
}

const getValidatorFromConfigElseEmpty = <
  T extends FunctionalModel,
  TValue extends FunctionalValue,
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

const getCommonNumberValidators = <TModifier extends PropertyModifier<number>>(
  config: PropertyConfig<TModifier>
) => {
  return [
    getValidatorFromConfigElseEmpty(config?.minValue, minNumber),
    getValidatorFromConfigElseEmpty(config?.maxValue, maxNumber),
  ]
}

const mergeValidators = <T extends Arrayable<FunctionalValue>>(
  config: PropertyConfig<T> | undefined,
  validators: readonly PropertyValidatorComponent<any>[]
) => {
  return [...validators, ...(config?.validators ? config.validators : [])]
}

export {
  isModelInstance,
  isReferencedProperty,
  getValueForModelInstance,
  getValueForReferencedModel,
  getCommonTextValidators,
  getValidatorFromConfigElseEmpty,
  getCommonNumberValidators,
  mergeValidators,
}
