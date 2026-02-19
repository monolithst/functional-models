import merge from 'lodash/merge'
import identity from 'lodash/identity'
import {
  PrimaryKeyType,
  DateValueType,
  PropertyConfig,
  Arrayable,
  DataValue,
  MaybeFunction,
  ModelType,
  DataDescription,
  ModelInstance,
  CreateParams,
  PropertyType,
} from '../types'
import {
  DatetimeProperty,
  IntegerProperty,
  TextProperty,
  UuidProperty,
} from '../properties'
import { unique } from './validation'
import { OrmPropertyConfig, DatabaseKeyPropertyConfig } from './types'
import { getPrimaryKeyGenerator } from './internal-libs'

const _defaultPropertyConfig = {
  unique: undefined,
}

/**
 * A property that automatically updates whenever the model instance is saved.
 * @param config
 */
export const LastModifiedDateProperty = (
  config: PropertyConfig<DateValueType> = {}
) => {
  const additionalMetadata = { lastModifiedUpdateMethod: () => new Date() }
  return DatetimeProperty(config, additionalMetadata)
}

/**
 * A property that represents a foreign key to another model in a database.
 * By default it is a "uuid" type, but if you want to use an arbitrary string, or an integer type you can set the `dataType` property.
 * NOTE: auto is ignored in config.
 * @param config - Additional configurations.
 */
export const ForeignKeyProperty = <
  TValue extends PrimaryKeyType,
  TModel extends DataDescription,
>(
  model: MaybeFunction<ModelType<TModel>>,
  config: Omit<
    DatabaseKeyPropertyConfig<TValue>,
    'auto' | 'primaryKeyGenerator'
  > = {}
) => {
  const _getModel = () => {
    if (typeof model === 'function') {
      return model()
    }
    return model
  }

  const _getProperty = () => {
    if (config.dataType === PropertyType.UniqueId) {
      return UuidProperty(
        merge(config as DatabaseKeyPropertyConfig<string>, {
          autoNow: false,
        })
      )
    }
    if (config.dataType === PropertyType.Integer) {
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

/**
 * A property that represents a primary key in a database.
 * By default it is a "uuid" type, but if you want to use an arbitrary string, or an integer type you can set the `dataType` property.
 * Includes an optional primaryKeyGenerator function that can be used to generate a primary key. This can allow primary keys that are generated at runtime, or grabbed from a database.
 * @param config - Additional configurations.
 * @returns
 */
export const PrimaryKeyProperty = <TValue extends PrimaryKeyType>(
  config: DatabaseKeyPropertyConfig<TValue> = {}
) => {
  const _getProperty = () => {
    const auto = config.auto === undefined ? true : config.auto ? true : false
    const lazyLoadMethod = (
      value: TValue,
      modelData: CreateParams<any>,
      instance: ModelInstance<any>
    ) => {
      if (config.primaryKeyGenerator) {
        return config.primaryKeyGenerator(value, modelData, instance)
      }
      if (auto) {
        return getPrimaryKeyGenerator(config)(value, modelData, instance)
      }
      return value
    }

    if (config.dataType === PropertyType.UniqueId) {
      return UuidProperty(
        merge(config as DatabaseKeyPropertyConfig<string>, {
          autoNow: auto,
          lazyLoadMethod,
        })
      )
    }
    if (config.dataType === PropertyType.Integer) {
      return IntegerProperty(
        merge(config as DatabaseKeyPropertyConfig<number>, {
          lazyLoadMethod,
        })
      )
    }
    return TextProperty(
      merge(config as DatabaseKeyPropertyConfig<string>, {
        lazyLoadMethod,
      })
    )
  }
  return _getProperty()
}

/**
 * Creates an orm based property config.
 * @param config - Additional configurations.
 */
export const ormPropertyConfig = <T extends Arrayable<DataValue>>(
  config: OrmPropertyConfig<T> = _defaultPropertyConfig
): PropertyConfig<T> => {
  return merge(config, {
    validators: [
      ...(config.validators ? config.validators : []),
      config.unique ? unique(config.unique) : null,
    ].filter(identity),
  })
}
