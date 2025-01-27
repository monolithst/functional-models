import flow from 'lodash/flow'
import {
  PropertyValidatorComponentAsync,
  DataDescription,
  PrimaryKeyType,
  ComponentValidationErrorResponse,
  JsonAble,
  ModelValidatorComponent,
} from '../types'
import { queryBuilder } from './query'
import {
  OrmSearch,
  OrmValidatorContext,
  OrmModelInstance,
  OrmModelExtensions,
  OrmModelInstanceExtensions,
} from './types'

const _doUniqueCheck = async <T extends DataDescription>(
  query: OrmSearch,
  instance: OrmModelInstance<T>,
  instanceData: T | JsonAble,
  buildErrorMessage: () => ComponentValidationErrorResponse
): Promise<ComponentValidationErrorResponse> => {
  const model = instance.getModel()
  const results = await model.search(query)
  const resultsLength = results.instances.length
  // There is nothing stored with this value.
  if (resultsLength < 1) {
    return undefined
  }
  const ids: readonly PrimaryKeyType[] = await Promise.all(
    results.instances.map((x: any) => x.getPrimaryKey())
  )
  // We have our match by id.
  // @ts-ignore
  const instanceId = instanceData[model.getModelDefinition().primaryKeyName]
  if (ids.length === 1 && ids[0] === instanceId) {
    return undefined
  }
  if (ids.length > 1) {
    // This is a weird but possible case where there is more than one item. We don't want to error
    // if the instance we are checking is already in the datastore.
    if (ids.find(x => x === instanceId)) {
      return undefined
    }
  }
  return buildErrorMessage()
}

/**
 * A validator that ensures that there is only one instance stored, that has a unique combination of values.
 * @param propertyKeyArray - An array of property names that create the unique match.
 */
const uniqueTogether = <T extends DataDescription>(
  propertyKeyArray: readonly string[]
): ModelValidatorComponent<
  T,
  OrmModelExtensions,
  OrmModelInstanceExtensions
> => {
  const _uniqueTogether = async (
    instance: OrmModelInstance<T>,
    instanceData: T | JsonAble,
    options: OrmValidatorContext
  ) => {
    if (options.noOrmValidation) {
      return undefined
    }
    const properties = propertyKeyArray.map(key => {
      // @ts-ignore
      return [key, instanceData[key]]
    })
    const query = flow(
      properties.map(([key, value], index) => {
        return b => {
          // We only want to do an 'and' if there is another property.
          if (index + 1 >= properties.length) {
            return b.property(key, value, { caseSensitive: false })
          }
          return b.property(key, value, { caseSensitive: false }).and()
        }
      })
    )(queryBuilder().take(2)).compile()
    return _doUniqueCheck<T>(query, instance, instanceData, () => {
      return propertyKeyArray.length > 1
        ? `${propertyKeyArray.join(
            ','
          )} must be unique together. Another instance found.`
        : `${propertyKeyArray[0]} must be unique. Another instance found.`
    })
  }
  return _uniqueTogether
}

/**
 * Validates that a stored instance is the only one that has a value for a specific property.
 * This only validates before the instance goes into the datastore.
 * @param propertyKey - The property key to check.
 */
const unique = <T extends DataDescription>(
  propertyKey: string
): PropertyValidatorComponentAsync<
  T,
  OrmModelExtensions,
  OrmModelInstanceExtensions
> => {
  const _unique: PropertyValidatorComponentAsync<
    T,
    OrmModelExtensions,
    OrmModelInstanceExtensions
  > = (value, instance, instanceData, options) => {
    return uniqueTogether<T>([propertyKey])(instance, instanceData, options)
  }
  return _unique
}

/**
 * Creates a base orm context.
 * @param noOrmValidation - Determines if the validation process should ignore any ORM related validation. (If you don't want to do a database query for a specific validation).
 */
const buildOrmValidatorContext = ({
  noOrmValidation = false,
}): OrmValidatorContext => ({
  noOrmValidation,
})

export { unique, uniqueTogether, buildOrmValidatorContext }
