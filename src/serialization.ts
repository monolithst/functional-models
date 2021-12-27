import merge from 'lodash/merge'
import { PropertyGetters, JsonAble, toObj } from './interfaces'

const _getValue = async (value: any): Promise<JsonAble|null> => {
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
  const asModel = value.toObj
  if (asModel) {
    return _getValue(await asModel())
  }
  // Dates
  const asDate = value as Date
  if (type === 'object' && asDate.toISOString) {
    return _getValue(asDate.toISOString())
  }
  return value
}

const toJsonAble =
  (keyToFunc: PropertyGetters<any>): toObj =>
  async () => {
    return Object.entries(keyToFunc).reduce(async (acc, [key, value]) => {
      const realAcc = await acc
      const trueValue = await _getValue(await value)
      return merge(realAcc, { [key]: trueValue })
    }, Promise.resolve({}))
  }

export { toJsonAble }
