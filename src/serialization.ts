import { loweredTitleCase } from './utils'
import { IModelInstance } from './interfaces'

const SIZE_OF_GET = 'get'.length
const IGNORABLE_KEYS = ['meta', 'functions']

type SerializableObj = {
  readonly [s: string]: Serializable
}

type Serializable = number | string | Date | null | undefined | boolean | IModelInstance | Function | SerializableObj

const _getValue = async (value: Serializable) : Promise<Serializable> => {
  if (value === undefined) {
    return null
  }
  if (value === null) {
    return null
  }
  const type = typeof value
  const asFunction = value as Function
  if (type === 'function') {
    return _getValue(await asFunction())
  }
  // Nested Object
  const asModel = value as IModelInstance
  if (type === 'object' && asModel.functions && asModel.functions.toObj) {
    return _getValue(await asModel.functions.toObj())
  }
  // Dates
  const asDate = value as Date
  if (type === 'object' && asDate.toISOString) {
    return _getValue(asDate.toISOString())
  }
  return value
}

const _getKey = (key: string) => {
  return key.startsWith('get') ? loweredTitleCase(key.slice(SIZE_OF_GET)) : key
}

const _shouldIgnoreKey = (key: string) => {
  return IGNORABLE_KEYS.includes(key)
}

const toObj = (keyToFunc: Object) => async () => {
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

export {
  toObj,
}
