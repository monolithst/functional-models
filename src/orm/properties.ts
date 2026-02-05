import merge from 'lodash/merge'
import identity from 'lodash/identity'
import {
  DateValueType,
  PropertyConfig,
  Arrayable,
  DataValue,
  MaybeFunction,
  ModelType,
  DataDescription,
} from '../types'
import {
  DatetimeProperty,
  IntegerProperty,
  TextProperty,
  UuidProperty,
} from '../properties'
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
 * A property that represents a key in a database.
 * By default it is a "uuid" type, but if you want to use an arbitrary string, or an integer type you can set the `dataType` property.
 * @interface
 */
type DatabaseKeyPropertyConfig<TValue extends string | number> =
  PropertyConfig<TValue> &
    Readonly<{
      /**
       * Sets the type of the foreign key.
       * @default 'uuid'
       */
      dataType?: 'uuid' | 'string' | 'integer'
      /**
       * If true, the key will be automatically generated if not provided. Only applies to uuids.
       * @default true
       */
      auto?: boolean
    }>

/**
 * A property that represents a foreign key to another model in a database.
 * By default it is a "uuid" type, but if you want to use an arbitrary string, or an integer type you can set the `dataType` property.
 * NOTE: auto is ignored in config.
 * @param config - Additional configurations.
 */
const ForeignKeyProperty = <
  TValue extends string | number,
  TModel extends DataDescription,
>(
  model: MaybeFunction<ModelType<TModel>>,
  config: DatabaseKeyPropertyConfig<TValue> = {}
) => {
  const _getModel = () => {
    if (typeof model === 'function') {
      return model()
    }
    return model
  }

  const _getProperty = () => {
    if (config.dataType === 'uuid') {
      return UuidProperty(
        merge(config as DatabaseKeyPropertyConfig<string>, {
          autoNow: false,
        })
      )
    }
    if (config.dataType === 'integer') {
      return IntegerProperty(config as DatabaseKeyPropertyConfig<number>)
    }
    return TextProperty(config as DatabaseKeyPropertyConfig<string>)
  }
  const property = _getProperty()
  return merge(property, {
    getReferencedId: (instanceValues: TValue) => {
      return instanceValues
    },
    getReferencedModel: _getModel,
  })
}

const PrimaryKeyProperty = <TValue extends string | number>(
  config: DatabaseKeyPropertyConfig<TValue> = {}
) => {
  const _getProperty = () => {
    const auto = config.auto === undefined ? true : config.auto ? true : false
    if (config.dataType === 'uuid') {
      return UuidProperty(
        merge(config as DatabaseKeyPropertyConfig<string>, {
          autoNow: auto,
        })
      )
    }
    if (config.dataType === 'integer') {
      return IntegerProperty(config as DatabaseKeyPropertyConfig<number>)
    }
    return TextProperty(config as DatabaseKeyPropertyConfig<string>)
  }
  return _getProperty()
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

export {
  ormPropertyConfig,
  LastModifiedDateProperty,
  ForeignKeyProperty,
  PrimaryKeyProperty,
}
