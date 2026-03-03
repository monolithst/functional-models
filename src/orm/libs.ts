import flow from 'lodash/flow.js'
import { QueryBuilder, DatastoreValueType, PropertyOptions } from './types'

/**
 * Creates multiple property OR queries added to the passed in query builder.
 * Returns another QueryBuilder.
 */
export const multipleOrQuery = <T>(
  queryBuilder: QueryBuilder,
  propertyKey: string,
  values: readonly T[],
  propertyType?: DatastoreValueType,
  propertyOptions?: PropertyOptions
): QueryBuilder => {
  if (values.length === 0) {
    return queryBuilder
  }

  return flow(
    values.map((v, index) => {
      return (qb: QueryBuilder) => {
        const withProperty = qb.property(propertyKey, v, {
          ...(propertyOptions || {}),
          type: propertyType || DatastoreValueType.string,
        })
        // Add 'or()' only if this is not the last item
        return index < values.length - 1 ? withProperty.or() : withProperty
      }
    })
  )(queryBuilder)
}

/**
 * Creates multiple AND queries.
 */
export const multipleAndQuery = <T>(
  queryBuilder: QueryBuilder,
  propertyKey: string,
  values: readonly T[],
  propertyType?: DatastoreValueType
): QueryBuilder => {
  if (values.length === 0) {
    return queryBuilder
  }

  return flow(
    values.map((v, index) => {
      return (qb: QueryBuilder) => {
        const withProperty = qb.property(propertyKey, v, {
          type: propertyType || DatastoreValueType.string,
        })
        // Add 'or()' only if this is not the last item
        return index < values.length - 1 ? withProperty.and() : withProperty
      }
    })
  )(queryBuilder)
}
