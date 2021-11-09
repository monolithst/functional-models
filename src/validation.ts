import isEmpty from 'lodash/isEmpty'
import merge from 'lodash/merge'
import isFunction from 'lodash/isFunction'
import flatMap from 'lodash/flatMap'
import get from 'lodash/get'
import {
  IModelProperties,
  IModelInstance,
  IModel,
  IModelValidator,
  IModelComponentValidator,
  IPropertyValidatorComponent,
  IPropertyValidatorComponentType,
  IPropertyValidatorComponentAsync,
  IPropertyValidatorComponentSync,
  IPropertyValidator,
  IPropertyConfig,
} from './interfaces'

const TYPE_PRIMATIVES = {
  boolean: 'boolean',
  string: 'string',
  object: 'object',
  number: 'number',
  integer: 'integer',
}

function filterEmpty<T> (array: (T|undefined|null)[]) : T[]{
  let array2 : T[] = []
  for(const i in array){
    const item = array[i]
    if (item === undefined) continue
    if (item === null) continue
    // @ts-ignore
    array2.push(array[i])
  }
  return array2
}

const notEmpty = <TValue extends unknown>(value: TValue | null | undefined): value is TValue => {
  if (value === null || value === undefined) return false
  const testDummy: TValue = value
  return true
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

const arrayType = (type: string) : IPropertyValidatorComponentSync => (value: Array<any>) => {
  // @ts-ignore
  const arrayError = isArray(value)
  if (arrayError) {
    return arrayError
  }
  const validator = PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR[type] || isType(type)
  return value.reduce((acc, v) => {
    if (acc) {
      return acc
    }
    // @ts-ignore
    return validator(v)
  }, undefined)
}

const multiplePropertiesMustMatch = (
  getKeyA: (instance: IModelInstance) => string,
  getKeyB: (instance: IModelInstance) => string,
  errorMessage: string='Properties do not match'
) : IPropertyValidatorComponentAsync => async (_: any, instance: IModelInstance) => {
  const keyA = await getKeyA(instance)
  const keyB = await getKeyB(instance)
  if (keyA !== keyB) {
    return errorMessage
  }
  return undefined
}

const meetsRegex =
  (regex: string|RegExp, flags?: string, errorMessage : string = 'Format was invalid') : IPropertyValidatorComponentSync =>
    (value: string) => {
    const reg = new RegExp(regex, flags)
    // @ts-ignore
    return _trueOrError((v: string) => reg.test(v), errorMessage)(value)
  }

const choices = (choiceArray: string[]) : IPropertyValidatorComponentSync => (value?: string[]) => {
  if (Array.isArray(value)) {
    const bad = value.find(v => !choiceArray.includes(v))
    if (bad) {
      return `${bad} is not a valid choice`
    }
  } else {
    if (!choiceArray.includes(String(value))) {
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

const referenceTypeMatch = (referencedModel: IModel | (() => IModel) ) : IPropertyValidatorComponentType<IModelInstance> => {
  return (value?: IModelInstance) => {
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
    const aModel = value.meta.getModel().getName()
    if (eModel !== aModel) {
      return `Model should be ${eModel} instead, received ${aModel}`
    }
    return undefined
  }
}

const aggregateValidator = (methodOrMethods: IPropertyValidatorComponent | readonly IPropertyValidatorComponent[]) => {
  const toDo = Array.isArray(methodOrMethods)
    ? methodOrMethods
    : [methodOrMethods]

  const _aggregativeValidator : IPropertyValidator = async (value: any, instance: IModelInstance, data: Object) => {
    const values = await Promise.all(
      toDo.map(method => {
        return method(value, instance, data)
      })
    )
    return filterEmpty(values)
  }
  return _aggregativeValidator
}

const emptyValidator : IPropertyValidatorComponentSync = () => undefined

const _boolChoice = (method: (configValue: any) => IPropertyValidatorComponentSync) => (configValue: any) => {
  const func = configValue ? method(configValue) : undefined
  const validatorWrapper : IPropertyValidatorComponentSync = (value: any, modelInstance: IModelInstance, modelData: Object) => {
    if (!func){
      return undefined
    }
    return func(value, modelInstance, modelData)
  }
  return validatorWrapper
}

type MethodConfigDict = {
  readonly [s: string]: (config: any) => IPropertyValidatorComponentSync | undefined
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

const createPropertyValidator = (config: IPropertyConfig) : IPropertyValidator => {
  const validators : readonly IPropertyValidatorComponent[] = [
    ...Object.entries(config).map(([key, value]) => {
      const method = CONFIG_TO_VALIDATE_METHOD[key]
      if (method) {
        const validator = method(value)
        if (validator === undefined) {
          return emptyValidator
        }
        return validator
      }
      return emptyValidator
    }),
    ...(config.validators ? config.validators : []),
  ].filter(x=>x)
  const isRequiredValue = config.required
    ? true
    : validators.includes(isRequired)
  const validator = aggregateValidator(validators)
  const _propertyValidator : IPropertyValidator = async (value, instance, instanceData={}, options) => {
    if (!value && !isRequiredValue) {
      return []
    }
    const errors = await validator(value, instance, instanceData)
    return [...new Set(flatMap(errors))]
  }
  return _propertyValidator
}

const createModelValidator = (properties: IModelProperties, modelValidators? : IModelComponentValidator[]) => {
  const _modelValidator : IModelValidator = async (instance, options) => {
    if (!instance) {
      throw new Error(`Instance cannot be empty`)
    }
    const keysAndFunctions = Object.entries(
      get(properties, 'functions.validators', {})
    )
    const instanceData = await instance.functions.toObj()
    const propertyValidationErrors = await Promise.all(
      keysAndFunctions.map(async ([key, validator]) => {
        return [key, await validator(instance, instanceData, options)]
      })
    )
    const modelValidationErrors = (
      await Promise.all(
        modelValidators ? modelValidators.map(validator => validator(instance, instanceData, options)) : []
      )
    ).filter(x => x)
    const propertyErrors = propertyValidationErrors
      .filter(([_, errors]) => Boolean(errors) && errors.length > 0)
      .reduce((acc, [key, errors]) => {
        return { ...acc, [key]: errors }
      }, {})
    return modelValidationErrors.length > 0
      ? merge(propertyErrors, { overall: modelValidationErrors })
      : propertyErrors
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
