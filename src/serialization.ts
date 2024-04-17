import merge from 'lodash/merge'
import {
  PropertyGetters,
  JsonAble,
  toObj,
  FunctionalModel,
  TypedJsonObj,
  ModelInstance,
} from './interfaces'

const isModelInstance = (obj: any): obj is ModelInstance<any> => {
  return Boolean(obj.toObj)
}

const _getValue = async (value: any): Promise<JsonAble | null> => {
  if (value === undefined) {
    return null
  }
  if (value === null) {
    return null
  }
  const type = typeof value
  const asFunction = value as (...args: any[]) => any
  if (type === 'function') {
    return _getValue(await asFunction())
  }
  // Nested Object
  if (isModelInstance(value)) {
    return _getValue(await value.toObj())
  }
  // Dates
  const asDate = value as Date
  if (type === 'object' && asDate.toISOString) {
    return _getValue(asDate.toISOString())
  }
  return value
}

const toJsonAble =
  <T extends FunctionalModel>(keyToFunc: PropertyGetters<T>): toObj<T> =>
  () => {
    return Object.entries(keyToFunc).reduce(async (acc, [key, value]) => {
      const realAcc = await acc
      const trueValue = await _getValue(await value)
      return merge(realAcc, { [key]: trueValue })
    }, Promise.resolve({})) as Promise<TypedJsonObj<T>>
  }

export { toJsonAble }
