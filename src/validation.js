const isEmpty = require('lodash/isEmpty')
const flatMap = require('lodash/flatMap')
const get = require('lodash/get')

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
const isInteger = _trueOrError(v => {
  const numberError = isNumber(v)
  if (numberError) {
    return false
  }
  return Number.isNaN(parseInt(v, 10)) === false
}, 'Must be an integer')

const isBoolean = isType('boolean')
const isString = isType('string')

const meetsRegex = (
  regex,
  flags,
  errorMessage = 'Format was invalid'
) => value => {
  const reg = new RegExp(regex, flags)
  return _trueOrError(v => reg.test(v), errorMessage)(value)
}

const choices = choiceArray => value => {
  if (choiceArray.includes(value) === false) {
    return 'Not a valid choice'
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

const aggregateValidator = methodOrMethods => async value => {
  const toDo = Array.isArray(methodOrMethods)
    ? methodOrMethods
    : [methodOrMethods]
  const values = await Promise.all(
    toDo.map(method => {
      return method(value)
    })
  )
  return values.filter(x => x)
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
}

const createFieldValidator = config => {
  const validators = [
    ...Object.entries(config).map(([key, value]) => {
      return (CONFIG_TO_VALIDATE_METHOD[key] || (() => undefined))(value)
    }),
    ...(config.validators ? config.validators : []),
  ].filter(x => x)
  const validator =
    validators.length > 0 ? aggregateValidator(validators) : emptyValidator
  return async value => {
    const errors = await validator(value)
    return flatMap(errors)
  }
}

const createModelValidator = fields => async () => {
  const keysAndFunctions = Object.entries(get(fields, 'functions.validate', {}))
  const data = await Promise.all(
    keysAndFunctions.map(async ([key, validator]) => {
      return [key, await validator()]
    })
  )
  return data
    .filter(([_, errors]) => Boolean(errors) && errors.length > 0)
    .reduce((acc, [key, errors]) => {
      return { ...acc, [key]: errors }
    }, {})
}

module.exports = {
  isNumber,
  isBoolean,
  isString,
  isInteger,
  isType,
  isRequired,
  maxNumber,
  minNumber,
  choices,
  maxTextLength,
  minTextLength,
  meetsRegex,
  aggregateValidator,
  emptyValidator,
  createFieldValidator,
  createModelValidator,
}
