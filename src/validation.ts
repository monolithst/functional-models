import isEmpty from 'lodash/isEmpty'
import merge from 'lodash/merge'
import flatMap from 'lodash/flatMap'
import {
  FunctionalModel,
  IModelInstance,
  IModel,
  IModelComponentValidator,
  IPropertyValidatorComponent,
  IPropertyValidatorComponentType,
  IPropertyValidatorComponentAsync,
  IPropertyValidatorComponentSync,
  IPropertyValidatorComponentTypeAdvanced,
  IPropertyValidator,
  IPropertyConfig,
  FunctionalObj,
  MaybeFunction,
  IPropertyValidators, IValueGetter,
  Arrayable,
  FunctionalType, IModelErrors,
} from './interfaces'

const TYPE_PRIMATIVES = {
  boolean: 'boolean',
  string: 'string',
  object: 'object',
  number: 'number',
  integer: 'integer',
}

const filterEmpty = <T>(array: readonly (T|undefined|null)[]) : readonly T[] => {
  return array.filter(x=>x) as readonly T[]
}

const _trueOrError = (method: Function, error: string) : IPropertyValidatorComponentSync => (value: any) => {
  if (method(value) === false) {
    return error
  }
  return undefined
}

const _typeOrError = (type: string, errorMessage: string) : IPropertyValidatorComponentSync => (value: any) => {
  if (typeof value !== type) {
    return errorMessage
  }
  return undefined
}

const isType = (type: string) : IPropertyValidatorComponentSync => (value: any) => {
  // @ts-ignore
  return _typeOrError(type, `Must be a ${type}`)(value)
}
const isNumber = isType('number')
const isInteger = _trueOrError(Number.isInteger, 'Must be an integer')

const isBoolean = isType('boolean')
const isString = isType('string')
const isArray = _trueOrError((v: any) => Array.isArray(v), 'Value is not an array')

const PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR = {
  [TYPE_PRIMATIVES.boolean]: isBoolean,
  [TYPE_PRIMATIVES.string]: isString,
  [TYPE_PRIMATIVES.integer]: isInteger,
  [TYPE_PRIMATIVES.number]: isNumber,
}

const arrayType = (type: string) : IPropertyValidatorComponentSync => (value: Arrayable<FunctionalType>) => {
  // @ts-ignore
  const arrayError = isArray(value)
  if (arrayError) {
    return arrayError
  }
  const validator = PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR[type] || isType(type)
  return (value as readonly []).reduce((acc: string|undefined, v: FunctionalType) => {
    if (acc) {
      return acc
    }
    // @ts-ignore
    return validator(v)
  }, undefined)
}

const multiplePropertiesMustMatch = <T extends FunctionalModel>(
  getKeyA: (instance: IModelInstance<T>) => string,
  getKeyB: (instance: IModelInstance<T>) => string,
  errorMessage: string='Properties do not match'
) : IPropertyValidatorComponentAsync => async (_: any, instance: IModelInstance<T>) => {
  const keyA = await getKeyA(instance)
  const keyB = await getKeyB(instance)
  if (keyA !== keyB) {
    return errorMessage
  }
  return undefined
}

const meetsRegex =
  (regex: string|RegExp, flags?: string, errorMessage : string = 'Format was invalid') : IPropertyValidatorComponentSync =>
    (value: FunctionalType) => {
    const reg = new RegExp(regex, flags)
    // @ts-ignore
    return _trueOrError((v: string) => reg.test(v), errorMessage)(value)
  }

const choices = (choiceArray: readonly FunctionalType[]) : IPropertyValidatorComponentSync => (value: Arrayable<FunctionalType>) => {
  if (Array.isArray(value)) {
    const bad = value.find(v => !choiceArray.includes(v))
    if (bad) {
      return `${bad} is not a valid choice`
    }
  } else {
    if (!choiceArray.includes(value as FunctionalType)) {
      return `${value} is not a valid choice`
    }
  }
  return undefined
}

const isDate : IPropertyValidatorComponentType<Date> = (value: Date) => {
  if (!value) {
    return 'Date value is empty'
  }
  if (!value.toISOString) {
    return 'Value is not a date'
  }
  return undefined
}

const isRequired : IPropertyValidatorComponentSync = (value?: any) => {
  if (value === true || value === false) {
    return undefined
  }
  // @ts-ignore
  if (isNumber(value) === undefined) {
    return undefined
  }
  const empty = isEmpty(value)
  if (empty) {
    // @ts-ignore
    if (isDate(value)) {
      return 'A value is required'
    }
  }
  return undefined
}

const maxNumber = (max: Number) : IPropertyValidatorComponentType<number> => (value: number) => {
  // @ts-ignore
  const numberError = isNumber(value)
  if (numberError) {
    return numberError
  }
  if (value && (value > max)) {
    return `The maximum is ${max}`
  }
  return undefined
}

const minNumber = (min: Number) : IPropertyValidatorComponentType<number> => (value: Number) => {
  // @ts-ignore
  const numberError = isNumber(value)
  if (numberError) {
    return numberError
  }
  if (value && (value < min)) {
    return `The minimum is ${min}`
  }
  return undefined
}

const maxTextLength = (max: Number) : IPropertyValidatorComponentType<string> => (value: string) => {
  // @ts-ignore
  const stringError = isString(value)
  if (stringError) {
    return stringError
  }
  if (value && (value.length > max)) {
    return `The maximum length is ${max}`
  }
  return undefined
}

const minTextLength = (min: Number) : IPropertyValidatorComponentType<string> => (value : string) => {
  // @ts-ignore
  const stringError = isString(value)
  if (stringError) {
    return stringError
  }
  if (value && (value.length < min)) {
    return `The minimum length is ${min}`
  }
  return undefined
}

const referenceTypeMatch = <TModel extends FunctionalModel>(referencedModel: MaybeFunction<IModel<TModel>>) : IPropertyValidatorComponentTypeAdvanced<IModelInstance<TModel>, TModel> => {
  return (value?: IModelInstance<TModel>) => {
    if (!value) {
      return 'Must include a value'
    }
    // This needs to stay here, as it delays the creation long enough for
    // self referencing types.
    const model = typeof referencedModel === 'function'
      ? referencedModel()
      : referencedModel
    // Assumption: By the time this is received, value === a model instance.
    const eModel = model.getName()
    const aModel = value.getModel().getName()
    if (eModel !== aModel) {
      return `Model should be ${eModel} instead, received ${aModel}`
    }
    return undefined
  }
}

const aggregateValidator = (value: any, methodOrMethods: IPropertyValidatorComponent | readonly IPropertyValidatorComponent[]) => {
  const toDo = Array.isArray(methodOrMethods)
    ? methodOrMethods
    : [methodOrMethods]

  const _aggregativeValidator : IPropertyValidator = async (instance: IModelInstance<any>, instanceData: FunctionalObj) => {
    const values = await Promise.all(
      toDo.map(method => {
        return method(value, instance, instanceData)
      })
    )
    return filterEmpty(values)
  }
  return _aggregativeValidator
}

const emptyValidator : IPropertyValidatorComponentSync = () => undefined

const _boolChoice = (method: (configValue: any) => IPropertyValidatorComponentSync) => (configValue: any) => {
  const func = configValue
    ? method(configValue)
    : undefined
  const validatorWrapper : IPropertyValidatorComponentSync = (value: any, modelInstance: IModelInstance<any>, modelData: FunctionalObj) => {
    if (!func){
      return undefined
    }
    return func(value, modelInstance, modelData)
  }
  return validatorWrapper
}

type MethodConfigDict = {
  readonly [s: string]: (config: any) => IPropertyValidatorComponentSync
}

const simpleFuncWrap = (validator: IPropertyValidatorComponentSync) => () => {
  return validator
}

const CONFIG_TO_VALIDATE_METHOD : MethodConfigDict = {
  required: _boolChoice(simpleFuncWrap(isRequired)),
  isInteger: _boolChoice(simpleFuncWrap(isInteger)),
  isNumber: _boolChoice(simpleFuncWrap(isNumber)),
  isString: _boolChoice(simpleFuncWrap(isString)),
  isArray: _boolChoice(simpleFuncWrap(isArray)),
  isBoolean: _boolChoice(simpleFuncWrap(isBoolean)),
  choices: _boolChoice(choices),
}

const createPropertyValidator = (valueGetter: IValueGetter, config: IPropertyConfig) : IPropertyValidator => {
  const _propertyValidator : IPropertyValidator = async (instance, instanceData: FunctionalObj) => {
    const validators : readonly IPropertyValidatorComponent[] = [
      ...Object.entries(config as {}).map(([key, value]) => {
        const method = CONFIG_TO_VALIDATE_METHOD[key]
        if (method) {
          return method(value)
        }
        return emptyValidator
      }),
      ...(config?.validators ? config.validators : []),
    ].filter(x=>x)
    const value = await valueGetter()
    const isRequiredValue = config?.required
      ? true
      : validators.includes(isRequired)
    if (!value && !isRequiredValue) {
      return []
    }
    const validator = aggregateValidator(value, validators)
    const errors = await validator(instance, instanceData)
    return [...new Set(flatMap(errors))]
  }
  return _propertyValidator
}

const createModelValidator = (validators: IPropertyValidators, modelValidators? : readonly IModelComponentValidator[]) => {
  const _modelValidator = async (instance: IModelInstance<any>, options: object) : Promise<IModelErrors> => {
    return Promise.resolve()
      .then(async () => {
        if (!instance) {
          throw new Error(`Instance cannot be empty`)
        }
        const keysAndFunctions = Object.entries(validators)
        const instanceData = await instance.toObj()
        const propertyValidationErrors = await Promise.all(
          keysAndFunctions.map(async ([key, validator]) => {
            return [key, await validator(instance, instanceData)]
          })
        )
        const modelValidationErrors = (
          await Promise.all(
            modelValidators ? modelValidators.map(validator => validator(instance, instanceData, options)) : []
          )
        ).filter(x => x)
        const propertyErrors = propertyValidationErrors
          .filter(([, errors]) => Boolean(errors) && errors.length > 0)
          .reduce((acc, [key, errors]) => {
            return merge(acc, {[String(key)]: errors })
          }, {})
        return modelValidationErrors.length > 0
          ? merge(propertyErrors, { overall: modelValidationErrors })
          : propertyErrors
      })
  }
  return _modelValidator
}

export {
  isNumber,
  isBoolean,
  isString,
  isInteger,
  isType,
  isDate,
  isArray,
  isRequired,
  maxNumber,
  minNumber,
  choices,
  maxTextLength,
  minTextLength,
  meetsRegex,
  aggregateValidator,
  emptyValidator,
  createPropertyValidator,
  createModelValidator,
  arrayType,
  referenceTypeMatch,
  multiplePropertiesMustMatch,
  TYPE_PRIMATIVES,
}
