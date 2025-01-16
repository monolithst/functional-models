import isEmpty from 'lodash/isEmpty'
import merge from 'lodash/merge'
import flatMap from 'lodash/flatMap'
import {
  DataDescription,
  ModelInstance,
  ModelType,
  ModelValidatorComponent,
  PropertyValidatorComponent,
  PropertyValidatorComponentSync,
  PropertyValidator,
  PropertyConfig,
  PropertyValidators,
  ValueGetter,
  Arrayable,
  DataValue,
  ModelErrors,
  ValidatorContext,
  ValuePropertyValidatorComponent,
  ValidationErrors,
  MaybeFunction,
  PropertyValidatorComponentTypeAdvanced,
  PrimitiveValueType,
  ToObjectResult,
} from './types'
import { flowFindFirst } from './utils'

const multiValidator = <T extends Arrayable<DataValue>>(
  validators: ValuePropertyValidatorComponent<T>[]
): ValuePropertyValidatorComponent<T> => {
  const flow = flowFindFirst<T, string>(
    validators as ((t: T) => undefined | string)[]
  )
  return flow as ValuePropertyValidatorComponent<T>
}

const filterEmpty = <T>(
  array: readonly (T | undefined | null)[]
): readonly T[] => {
  return array.filter(x => x) as readonly T[]
}

const _trueOrError =
  <T extends Arrayable<DataValue>>(
    method: (t: T) => boolean,
    error: string
  ): ValuePropertyValidatorComponent<T> =>
  (value: T) => {
    if (method(value) === false) {
      return error
    }
    return undefined
  }

const _typeOrError =
  <T extends Arrayable<DataValue>>(
    type: string,
    errorMessage: string
  ): ValuePropertyValidatorComponent<T> =>
  (value: T) => {
    if (typeof value !== type) {
      return errorMessage
    }
    return undefined
  }

const isType =
  <T extends Arrayable<DataValue>>(
    type: string
  ): ValuePropertyValidatorComponent<T> =>
  (value: T) => {
    // @ts-ignore
    return _typeOrError(type, `Must be a ${type}`)(value)
  }
const isNumber = isType<number>('number')
const isInteger = _trueOrError<number>(Number.isInteger, 'Must be an integer')

const isObject = multiValidator<object>([
  isType<object>('object'),
  x => (Array.isArray(x) ? 'Must be an object, but got an array' : undefined),
])
const isBoolean = isType<boolean>('boolean')
const isString = isType<string>('string')
const isArray = _trueOrError<readonly DataValue[]>(
  (v: any) => Array.isArray(v),
  'Value is not an array'
)

const PRIMITIVE_TO_SPECIAL_TYPE_VALIDATOR: Record<
  PrimitiveValueType,
  ValuePropertyValidatorComponent<any>
> = {
  [PrimitiveValueType.boolean]: isBoolean,
  [PrimitiveValueType.string]: isString,
  [PrimitiveValueType.integer]: isInteger,
  [PrimitiveValueType.number]: isNumber,
  [PrimitiveValueType.object]: isObject,
}

const arrayType =
  <T extends DataValue>(
    type: PrimitiveValueType
  ): ValuePropertyValidatorComponent<readonly T[]> =>
  (value: readonly T[]) => {
    // @ts-ignore
    const arrayError = isArray(value)
    if (arrayError) {
      return arrayError
    }
    const validator = PRIMITIVE_TO_SPECIAL_TYPE_VALIDATOR[type] || isType(type)
    return (value as readonly []).reduce(
      (acc: string | undefined, v: DataValue) => {
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
  <T extends DataValue>(
    regex: string | RegExp,
    flags?: string,
    errorMessage = 'Format was invalid'
  ): ValuePropertyValidatorComponent<T> =>
  (value: T) => {
    const reg = new RegExp(regex, flags)
    // @ts-ignore
    return _trueOrError((v: string) => reg.test(v), errorMessage)(value)
  }

const choices =
  <T extends DataValue>(
    choiceArray: readonly T[]
  ): ValuePropertyValidatorComponent<T> =>
  (value: T | readonly T[]) => {
    if (Array.isArray(value)) {
      const bad = value.find(v => !choiceArray.includes(v))
      if (bad) {
        return `${bad} is not a valid choice`
      }
    } else {
      if (!choiceArray.includes(value as T)) {
        return `${value} is not a valid choice`
      }
    }
    return undefined
  }

const isDate: ValuePropertyValidatorComponent<Date> = (value: Date) => {
  if (!value) {
    return 'Date value is empty'
  }
  if (!value.toISOString) {
    return 'Value is not a date'
  }
  return undefined
}

const isRequired: ValuePropertyValidatorComponent<any> = (value?: any) => {
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
  (max: number): ValuePropertyValidatorComponent<number> =>
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
  (min: number): ValuePropertyValidatorComponent<number> =>
  (value: number) => {
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
  (max: number): ValuePropertyValidatorComponent<string> =>
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
  (min: number): ValuePropertyValidatorComponent<string> =>
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

const aggregateValidator = <T extends DataDescription>(
  value: any,
  methodOrMethods:
    | PropertyValidatorComponent<T>
    | readonly PropertyValidatorComponent<T>[]
): PropertyValidator<T> => {
  const toDo = Array.isArray(methodOrMethods)
    ? methodOrMethods
    : [methodOrMethods]

  const _aggregativeValidator: PropertyValidator<T> = async (
    instanceData: ToObjectResult<T>,
    propertyConfiguration
  ) => {
    const values = await Promise.all(
      toDo.map(method => {
        return method(value, instanceData, propertyConfiguration)
      })
    )
    return filterEmpty(values)
  }
  return _aggregativeValidator
}

const emptyValidator = () => undefined

const _boolChoice =
  <T extends DataDescription>(
    method: (configValue: any) => PropertyValidatorComponentSync<T>
  ) =>
  (configValue: any) => {
    const func = method(configValue)
    const validatorWrapper: PropertyValidatorComponentSync<T> = func
    return validatorWrapper
  }

type MethodConfigDict<T extends DataDescription> = Readonly<{
  [s: string]: (config: any) => PropertyValidatorComponentSync<T>
}>

const simpleFuncWrap =
  <T extends DataDescription>(validator: PropertyValidatorComponentSync<T>) =>
  () => {
    return validator
  }

const includeOrDont =
  <T extends DataDescription>(
    method: () => PropertyValidatorComponentSync<T>
  ) =>
  (configValue: any) => {
    if (configValue === false) {
      return emptyValidator
    }
    const func = method()
    const validatorWrapper: PropertyValidatorComponentSync<T> = func
    return validatorWrapper
  }

const CONFIG_TO_VALIDATE_METHOD = <
  T extends DataDescription,
>(): MethodConfigDict<T> => ({
  required: includeOrDont(simpleFuncWrap(isRequired)),
  isInteger: _boolChoice<T>(simpleFuncWrap(isInteger)),
  isNumber: _boolChoice<T>(simpleFuncWrap(isNumber)),
  isString: _boolChoice<T>(simpleFuncWrap(isString)),
  isArray: _boolChoice<T>(simpleFuncWrap(isArray)),
  isBoolean: _boolChoice<T>(simpleFuncWrap(isBoolean)),
  choices: _boolChoice<T>(choices),
})

const createPropertyValidator = <
  TValue extends Arrayable<DataValue>,
  T extends DataDescription = DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
>(
  valueGetter: ValueGetter<
    TValue,
    T,
    TModelExtensions,
    TModelInstanceExtensions
  >,
  config: PropertyConfig<TValue>
): PropertyValidator<T> => {
  const _propertyValidator = async <T extends DataDescription>(
    instanceData: ToObjectResult<T>,
    propertyConfiguration: ValidatorContext
  ): Promise<ValidationErrors> => {
    return Promise.resolve().then(async () => {
      const configToValidateMethod = CONFIG_TO_VALIDATE_METHOD<T>()
      if (!config) {
        config = {}
      }
      const validators: readonly PropertyValidatorComponent<T>[] = [
        ...Object.entries(config).map(([key, value]) => {
          const method = configToValidateMethod[key]
          if (method) {
            return method(value)
          }
          return emptyValidator
        }),
        ...(config.validators ? config.validators : []),
      ].filter(x => x) as PropertyValidatorComponent<T>[]
      const value = await valueGetter()
      const isRequiredValue = config.required
        ? true
        : validators.includes(isRequired)
      if (!value && !isRequiredValue) {
        return []
      }
      const validator = aggregateValidator<T>(value, validators)
      const errors = await validator(instanceData, propertyConfiguration)
      return [...new Set(flatMap(errors))]
    })
  }
  return _propertyValidator
}

const createModelValidator = <
  T extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
>(
  validators: PropertyValidators<T>,
  modelValidators?: readonly ModelValidatorComponent<
    T,
    TModelExtensions,
    TModelInstanceExtensions
  >[]
) => {
  const _modelValidator = async (
    instance: ModelInstance<T, TModelExtensions, TModelInstanceExtensions>,
    propertyConfiguration: ValidatorContext
  ): Promise<ModelErrors<T> | undefined> => {
    return Promise.resolve().then(async () => {
      if (!instance) {
        throw new Error(`Instance cannot be empty`)
      }
      const keysAndFunctions = Object.entries(validators)
      const instanceData = await instance.toObj<T>()
      const propertyValidationErrors = await Promise.all(
        keysAndFunctions.map(async ([key, validator]) => {
          return [key, await validator(instanceData, propertyConfiguration)]
        })
      )
      const modelValidationErrors = (
        await Promise.all(
          modelValidators
            ? modelValidators.map(validator => {
                return validator(instance, instanceData, propertyConfiguration)
              })
            : []
        )
      ).filter(x => x) as readonly string[]
      const propertyErrors = propertyValidationErrors
        .filter(([, errors]) => Boolean(errors) && errors.length > 0)
        .reduce((acc, [key, errors]) => {
          return merge(acc, { [String(key)]: errors })
        }, {} as ModelErrors<T>)
      const final =
        modelValidationErrors.length > 0
          ? merge(propertyErrors, { overall: modelValidationErrors })
          : propertyErrors
      if (isEmpty(final)) {
        return undefined
      }
      return final
    })
  }
  return _modelValidator
}

const isValid = <T extends DataDescription>(errors: ModelErrors<T>) => {
  return Object.keys(errors).length < 1
}

const referenceTypeMatch = (
  referencedModel: MaybeFunction<ModelType<any>>
): PropertyValidatorComponentTypeAdvanced<
  ModelInstance<any, any, any>,
  any
> => {
  return (value?: ModelInstance<any, any, any>) => {
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

const objectValidator = <T extends object>({
  required,
  keyToValidators,
}: {
  required?: boolean
  keyToValidators: {
    [s: string]:
      | ValuePropertyValidatorComponent<any>
      | ValuePropertyValidatorComponent<any>[]
  }
}): ValuePropertyValidatorComponent<T> => {
  return (obj: T) => {
    if (!obj) {
      if (required) {
        return 'Must include a value'
      }
      return undefined
    }
    const isNotObj = isObject(obj)
    if (isNotObj) {
      return isNotObj
    }
    return (
      Object.entries(obj)
        .reduce((acc, [key, value]) => {
          const validators = keyToValidators[key]
          if (!validators) {
            return acc
          }
          const validator = Array.isArray(validators)
            ? multiValidator(validators)
            : validators
          const error = validator(value)
          if (error) {
            return acc.concat(`${key}: ${error}`)
          }
          return acc
        }, [] as string[])
        .join(', ') || undefined
    )
  }
}

const optionalValidator = <T extends Arrayable<DataValue>>(
  validator: ValuePropertyValidatorComponent<T>
): ValuePropertyValidatorComponent<T> => {
  return (v: T | undefined): string | undefined => {
    if (v === undefined || v === null) {
      return undefined
    }
    return validator(v)
  }
}

const UUID_VALIDATOR =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

const isValidUuid: ValuePropertyValidatorComponent<string> = (uuid: string) => {
  const stringError = isString(uuid)
  if (stringError) {
    return stringError
  }
  return meetsRegex<string>(UUID_VALIDATOR, 'g', 'Invalid UUID format')(uuid)
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
  isValid,
  referenceTypeMatch,
  multiValidator,
  isObject,
  objectValidator,
  optionalValidator,
  isValidUuid,
}
