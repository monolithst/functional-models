import { PropertyType, PrimaryKeyType } from '../types.js'
import { createUuid, getRandomValues } from '../utils.js'
import {
  DatabaseKeyPropertyConfig,
  PrimaryKeyGenerator,
  PrimaryKeyPropertyType,
} from './types.js'

const _getModelIdPropertyType = (
  config: DatabaseKeyPropertyConfig<any> = {}
): PrimaryKeyPropertyType => {
  return config.dataType || PropertyType.UniqueId
}

export const getPrimaryKeyGenerator = <TValue extends PrimaryKeyType>(
  config: DatabaseKeyPropertyConfig<TValue> = {}
): PrimaryKeyGenerator => {
  const custom = config.primaryKeyGenerator
  if (custom) {
    return custom
  }
  const idType = _getModelIdPropertyType(config)
  switch (idType) {
    case PropertyType.Integer:
      return () => Promise.resolve(getRandomValues()[0]!)
    default: {
      return () => Promise.resolve(createUuid())
    }
  }
}
