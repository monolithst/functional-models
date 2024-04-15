import get from 'lodash/get'
import {
  Arrayable,
  FunctionalModel,
  FunctionalValue,
  ModelInstance,
  PrimaryKeyType,
  PropertyConfig,
  PropertyModifier,
  PropertyValidatorComponent,
  PropertyValidatorComponentTypeAdvanced,
} from './interfaces'
import { createHeadAndTail } from './utils'
import {
  emptyValidator,
  maxNumber,
  maxTextLength,
  minNumber,
  minTextLength,
} from './validation'

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
  return get(modelReference, tail)
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
): readonly PropertyValidatorComponent<any>[] => {
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
): PropertyValidatorComponent<T> => {
  if (input !== undefined) {
    const validator = validatorGetter(input)
    return validator
  }
  return emptyValidator
}

const getCommonNumberValidators = <TModifier extends PropertyModifier<number>>(
  config: PropertyConfig<TModifier>
): readonly PropertyValidatorComponent<any>[] => {
  return [
    getValidatorFromConfigElseEmpty(config?.minValue, minNumber),
    getValidatorFromConfigElseEmpty(config?.maxValue, maxNumber),
  ]
}

const mergeValidators = <T extends Arrayable<FunctionalValue>>(
  config: PropertyConfig<T> | undefined,
  validators: readonly (
    | PropertyValidatorComponent<any>
    | PropertyValidatorComponentTypeAdvanced<any, any>
  )[]
): PropertyValidatorComponent<any>[] => {
  return [...validators, ...(config?.validators ? config.validators : [])]
}

export {
  isReferencedProperty,
  getValueForModelInstance,
  getValueForReferencedModel,
  getCommonTextValidators,
  getValidatorFromConfigElseEmpty,
  getCommonNumberValidators,
  mergeValidators,
}
