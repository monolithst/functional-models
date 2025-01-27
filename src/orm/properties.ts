import merge from 'lodash/merge'
import identity from 'lodash/identity'
import { DateValueType, PropertyConfig, Arrayable, DataValue } from '../types'
import { DatetimeProperty } from '../properties'
import { unique } from './validation'
import { OrmPropertyConfig } from './types'

const _defaultPropertyConfig = {
  unique: undefined,
}

/**
 * A property that automatically updates whenever the model instance is saved.
 * @param config
 */
const LastModifiedDateProperty = (
  config: PropertyConfig<DateValueType> = {}
) => {
  const additionalMetadata = { lastModifiedUpdateMethod: () => new Date() }
  return DatetimeProperty(config, additionalMetadata)
}

/**
 * Creates an orm based property config.
 * @param config - Additional configurations.
 */
const ormPropertyConfig = <T extends Arrayable<DataValue>>(
  config: OrmPropertyConfig<T> = _defaultPropertyConfig
): PropertyConfig<T> => {
  return merge(config, {
    validators: [
      ...(config.validators ? config.validators : []),
      config.unique ? unique(config.unique) : null,
    ].filter(identity),
  })
}

export { ormPropertyConfig, LastModifiedDateProperty }
