const isEmpty = require('lodash/isEmpty')
const flatMap = require('lodash/flatMap')
const get = require('lodash/get')

const TYPE_PRIMATIVES = {
  boolean: 'boolean',
  string: 'string',
  object: 'object',
  number: 'number',
  integer: 'integer',
}

const _trueOrError = (method, error) => value => {
  if (method(value) === false) {
    return error
  }
  return undefined
}

const _typeOrError = (type, errorMessage) => value => {
  if (typeof value !== type) {
    return errorMessage
  }
  return undefined
}

const isType = type => value => {
  return _typeOrError(type, `Must be a ${type}`)(value)
}
const isNumber = isType('number')
const isInteger = _trueOrError(Number.isInteger, 'Must be an integer')

const isBoolean = isType('boolean')
const isString = isType('string')
const isArray = _trueOrError(v => Array.isArray(v), 'Value is not an array')

const PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR = {
  [TYPE_PRIMATIVES.boolean]: isBoolean,
  [TYPE_PRIMATIVES.string]: isString,
  [TYPE_PRIMATIVES.integer]: isInteger,
  [TYPE_PRIMATIVES.number]: isNumber,
}

const arrayType = type => value => {
  const arrayError = isArray(value)
  if (arrayError) {
    return arrayError
  }
  const validator = PRIMATIVE_TO_SPECIAL_TYPE_VALIDATOR[type] || isType(type)
  return value.reduce((acc, v) => {
    if (acc) {
      return acc
    }
    return validator(v)
  }, undefined)
}

const meetsRegex =
  (regex, flags, errorMessage = 'Format was invalid') =>
  value => {
    const reg = new RegExp(regex, flags)
    return _trueOrError(v => reg.test(v), errorMessage)(value)
  }

const choices = choiceArray => value => {
  if (Array.isArray(value)) {
    const bad = value.find(v => !choiceArray.includes(v))
    if (bad) {
      return `${bad} is not a valid choice`
    }
  } else {
    if (choiceArray.includes(value) === false) {
      return `${value} is not a valid choice`
    }
  }
  return undefined
}

const isRequired = value => {
  if (value === true || value === false) {
    return undefined
  }
  if (isNumber(value) === undefined) {
    return undefined
  }
  return isEmpty(value) ? 'A value is required' : undefined
}

const maxNumber = max => value => {
  const numberError = isNumber(value)
  if (numberError) {
    return numberError
  }
  if (value > max) {
    return `The maximum is ${max}`
  }
  return undefined
}

const minNumber = min => value => {
  const numberError = isNumber(value)
  if (numberError) {
    return numberError
  }
  if (value < min) {
    return `The minimum is ${min}`
  }
  return undefined
}

const maxTextLength = max => value => {
  const stringError = isString(value)
  if (stringError) {
    return stringError
  }
  if (value.length > max) {
    return `The maximum length is ${max}`
  }
  return undefined
}

const minTextLength = min => value => {
  const stringError = isString(value)
  if (stringError) {
    return stringError
  }
  if (value.length < min) {
    return `The minimum length is ${min}`
  }
  return undefined
}

const aggregateValidator = methodOrMethods => {
  const toDo = Array.isArray(methodOrMethods)
    ? methodOrMethods
    : [methodOrMethods]

  const _aggregativeValidator = async value => {
    const values = await Promise.all(
      toDo.map(method => {
        return method(value)
      })
    )
    return values.filter(x => x)
  }
  return _aggregativeValidator
}

const emptyValidator = () => []

const _boolChoice = method => value => {
  return value ? method : undefined
}

const CONFIG_TO_VALIDATE_METHOD = {
  required: _boolChoice(isRequired),
  isInteger: _boolChoice(isInteger),
  isNumber: _boolChoice(isNumber),
  isString: _boolChoice(isString),
  isArray: _boolChoice(isArray),
  choices,
}

const createPropertyValidator = config => {
  const validators = [
    ...Object.entries(config).map(([key, value]) => {
      return (CONFIG_TO_VALIDATE_METHOD[key] || (() => undefined))(value)
    }),
    ...(config.validators ? config.validators : []),
  ].filter(x => x)
  const validator =
    validators.length > 0 ? aggregateValidator(validators) : emptyValidator
  const _propertyValidator = async value => {
    const errors = await validator(value)
    return [...new Set(flatMap(errors))]
  }
  return _propertyValidator
}

const createModelValidator = properties => {
  const _modelValidator = async () => {
    const keysAndFunctions = Object.entries(
      get(properties, 'functions.validate', {})
    )
    const data = await Promise.all(
      keysAndFunctions.map(async ([key, validator]) => {
        if (key === 'model') {
          return [key, []]
        }
        return [key, await validator()]
      })
    )
    return data
      .filter(([_, errors]) => Boolean(errors) && errors.length > 0)
      .reduce((acc, [key, errors]) => {
        return { ...acc, [key]: errors }
      }, {})
  }
  return _modelValidator
}

module.exports = {
  isNumber,
  isBoolean,
  isString,
  isInteger,
  isType,
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
  TYPE_PRIMATIVES,
}
