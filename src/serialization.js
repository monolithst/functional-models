const { loweredTitleCase } = require('./utils')

const SIZE_OF_GET = 'get'.length
const IGNORABLE_KEYS = ['meta', 'functions']

const _getValue = async value => {
  if (value === undefined) {
    return null
  }
  if (value === null) {
    return null
  }
  const type = typeof value
  if (type === 'function') {
    return _getValue(await value())
  }
  // Nested Json
  if (type === 'object' && value.functions && value.functions.toObj) {
    return _getValue(await value.functions.toObj())
  }
  // Dates
  if (type === 'object' && value.toISOString) {
    return _getValue(value.toISOString())
  }
  return value
}

const _getKey = key => {
  return key.startsWith('get') ? loweredTitleCase(key.slice(SIZE_OF_GET)) : key
}

const _shouldIgnoreKey = key => {
  return IGNORABLE_KEYS.includes(key)
}

const toObj = keyToFunc => async () => {
  return Object.entries(keyToFunc).reduce(async (acc, [key, value]) => {
    const realAcc = await acc
    if (_shouldIgnoreKey(key)) {
      return realAcc
    }
    const keyToUse = _getKey(key)
    const trueValue = await _getValue(value)
    return { ...realAcc, [keyToUse]: trueValue }
  }, Promise.resolve({}))
}

module.exports = {
  toObj,
}
