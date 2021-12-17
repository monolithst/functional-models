import isEmpty from 'lodash/isEmpty'
import merge from 'lodash/merge'
import flatMap from 'lodash/flatMap'
import {
  FunctionalModel,
  ModelInstance,
  Model,
  ModelComponentValidator,
  PropertyValidatorComponent,
  PropertyValidatorComponentType,
  PropertyValidatorComponentSync,
  PropertyValidatorComponentTypeAdvanced,
  PropertyValidator,
  PropertyConfig,
  MaybeFunction,
  PropertyValidators,
  ValueGetter,
  Arrayable,
  FunctionalType,
  ModelErrors,
  ValidatorConfiguration,
} from './interfaces'

const TYPE_PRIMITIVES = {
  boolean: 'boolean',
  string: 'string',
  object: 'object',
  number: 'number',
  integer: 'integer',
}

const filterEmpty = <T>(
  array: readonly (T | undefined | null)[]
): readonly T[] => {
  return array.filter(x => x) as readonly T[]
}

const _trueOrError =
  (method: Function, error: string): PropertyValidatorComponentSync =>
  (value: any) => {
    if (method(value) === false) {
      return error
    }
    return undefined
  }

const _typeOrError =
  (type: string, errorMessage: string): PropertyValidatorComponentSync =>
  (value: any) => {
    if (typeof value !== type) {
      return errorMessage
    }
    return undefined
  }

const isType =
  (type: string): PropertyValidatorComponentSync =>
  (value: any) => {
    // @ts-ignore
    return _typeOrError(type, `Must be a ${type}`)(value)
  }
const isNumber = isType('number')
const isInteger = _trueOrError(Number.isInteger, 'Must be an integer')

const isBoolean = isType('boolean')
const isString = isType('string')
const isArray = _trueOrError(
  (v: any) => Array.isArray(v),
  'Value is not an array'
)

const PRIMITIVE_TO_SPECIAL_TYPE_VALIDATOR = {
  [TYPE_PRIMITIVES.boolean]: isBoolean,
  [TYPE_PRIMITIVES.string]: isString,
  [TYPE_PRIMITIVES.integer]: isInteger,
  [TYPE_PRIMITIVES.number]: isNumber,
}

const arrayType =
  (type: string): PropertyValidatorComponentSync =>
  (value: Arrayable<FunctionalType>) => {
    // @ts-ignore
    const arrayError = isArray(value)
    if (arrayError) {
      return arrayError
    }
    const validator = PRIMITIVE_TO_SPECIAL_TYPE_VALIDATOR[type] || isType(type)
    return (value as readonly []).reduce(
      (acc: string | undefined, v: FunctionalType) => {
        if (acc) {
          return acc
        }
        // @ts-ignore
        return validator(v)
      },
      undefined
    )
  }

const meetsRegex =
  (
    regex: string | RegExp,
    flags?: string,
    errorMessage: string = 'Format was invalid'
  ): PropertyValidatorComponentSync =>
  (value: FunctionalType) => {
    const reg = new RegExp(regex, flags)
    // @ts-ignore
    return _trueOrError((v: string) => reg.test(v), errorMessage)(value)
  }

const choices =
  (choiceArray: readonly FunctionalType[]): PropertyValidatorComponentSync =>
  (value: Arrayable<FunctionalType>) => {
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

const isDate: PropertyValidatorComponentType<Date> = (value: Date) => {
  if (!value) {
    return 'Date value is empty'
  }
  if (!value.toISOString) {
    return 'Value is not a date'
  }
  return undefined
}

const isRequired: PropertyValidatorComponentSync = (value?: any) => {
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

const maxNumber =
  (max: Number): PropertyValidatorComponentType<number> =>
  (value: number) => {
    // @ts-ignore
    const numberError = isNumber(value)
    if (numberError) {
      return numberError
    }
    if (value && value > max) {
      return `The maximum is ${max}`
    }
    return undefined
  }

const minNumber =
  (min: Number): PropertyValidatorComponentType<number> =>
  (value: Number) => {
    // @ts-ignore
    const numberError = isNumber(value)
    if (numberError) {
      return numberError
    }
    if (value && value < min) {
      return `The minimum is ${min}`
    }
    return undefined
  }

const maxTextLength =
  (max: Number): PropertyValidatorComponentType<string> =>
  (value: string) => {
    // @ts-ignore
    const stringError = isString(value)
    if (stringError) {
      return stringError
    }
    if (value && value.length > max) {
      return `The maximum length is ${max}`
    }
    return undefined
  }

const minTextLength =
  (min: Number): PropertyValidatorComponentType<string> =>
  (value: string) => {
    // @ts-ignore
    const stringError = isString(value)
    if (stringError) {
      return stringError
    }
    if (value && value.length < min) {
      return `The minimum length is ${min}`
    }
    return undefined
  }

const referenceTypeMatch = <TModel extends FunctionalModel>(
  referencedModel: MaybeFunction<Model<TModel>>
): PropertyValidatorComponentTypeAdvanced<ModelInstance<TModel>, TModel> => {
  return (value?: ModelInstance<TModel>) => {
    if (!value) {
      return 'Must include a value'
    }
    // This needs to stay here, as it delays the creation long enough for
    // self referencing types.
    const model =
      typeof referencedModel === 'function'
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

const aggregateValidator = (
  value: any,
  methodOrMethods:
    | PropertyValidatorComponent
    | readonly PropertyValidatorComponent[]
) => {
  const toDo = Array.isArray(methodOrMethods)
    ? methodOrMethods
    : [methodOrMethods]

  const _aggregativeValidator: PropertyValidator = async (
    instance: ModelInstance<any>,
    instanceData: FunctionalModel,
    propertyConfiguration
  ) => {
    const values = await Promise.all(
      toDo.map(method => {
        return method(value, instance, instanceData, propertyConfiguration)
      })
    )
    return filterEmpty(values)
  }
  return _aggregativeValidator
}

const emptyValidator: PropertyValidatorComponentSync = () => undefined

const _boolChoice =
  (method: (configValue: any) => PropertyValidatorComponentSync) =>
  (configValue: any) => {
    const func = method(configValue)
    const validatorWrapper: PropertyValidatorComponentSync = (
      value: any,
      modelInstance: ModelInstance<any>,
      modelData: FunctionalModel
    ) => {
      return func(value, modelInstance, modelData, {})
    }
    return validatorWrapper
  }

type MethodConfigDict = {
  readonly [s: string]: (config: any) => PropertyValidatorComponentSync
}

const simpleFuncWrap = (validator: PropertyValidatorComponentSync) => () => {
  return validator
}

const CONFIG_TO_VALIDATE_METHOD: MethodConfigDict = {
  required: _boolChoice(simpleFuncWrap(isRequired)),
  isInteger: _boolChoice(simpleFuncWrap(isInteger)),
  isNumber: _boolChoice(simpleFuncWrap(isNumber)),
  isString: _boolChoice(simpleFuncWrap(isString)),
  isArray: _boolChoice(simpleFuncWrap(isArray)),
  isBoolean: _boolChoice(simpleFuncWrap(isBoolean)),
  choices: _boolChoice(choices),
}

const createPropertyValidator = <T extends Arrayable<FunctionalType>>(
  valueGetter: ValueGetter,
  config: PropertyConfig<T>
): PropertyValidator => {
  const _propertyValidator: PropertyValidator = async (
    instance,
    instanceData: FunctionalModel,
    propertyConfiguration
  ) => {
    if (!config) {
      config = {}
    }
    const validators: readonly PropertyValidatorComponent[] = [
      ...Object.entries(config).map(([key, value]) => {
        const method = CONFIG_TO_VALIDATE_METHOD[key]
        if (method) {
          return method(value)
        }
        return emptyValidator
      }),
      ...(config.validators ? config.validators : []),
    ].filter(x => x)
    const value = await valueGetter()
    const isRequiredValue = config.required
      ? true
      : validators.includes(isRequired)
    if (!value && !isRequiredValue) {
      return []
    }
    const validator = aggregateValidator(value, validators)
    const errors = await validator(
      instance,
      instanceData,
      propertyConfiguration
    )
    return [...new Set(flatMap(errors))]
  }
  return _propertyValidator
}

const createModelValidator = (
  validators: PropertyValidators,
  modelValidators?: readonly ModelComponentValidator[]
) => {
  const _modelValidator = async (
    instance: ModelInstance<any>,
    propertyConfiguration: ValidatorConfiguration
  ): Promise<ModelErrors> => {
    return Promise.resolve().then(async () => {
      if (!instance) {
        throw new Error(`Instance cannot be empty`)
      }
      const keysAndFunctions = Object.entries(validators)
      const instanceData = await instance.toObj()
      const propertyValidationErrors = await Promise.all(
        keysAndFunctions.map(async ([key, validator]) => {
          return [
            key,
            await validator(instance, instanceData, propertyConfiguration),
          ]
        })
      )
      const modelValidationErrors = (
        await Promise.all(
          modelValidators
            ? modelValidators.map(validator =>
                validator(instance, instanceData, propertyConfiguration)
              )
            : []
        )
      ).filter(x => x)
      const propertyErrors = propertyValidationErrors
        .filter(([, errors]) => Boolean(errors) && errors.length > 0)
        .reduce((acc, [key, errors]) => {
          return merge(acc, { [String(key)]: errors })
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
  TYPE_PRIMITIVES,
}
