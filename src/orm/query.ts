import merge from 'lodash/merge'
import omit from 'lodash/omit'
import {
  AllowableEqualitySymbols,
  BooleanQuery,
  BuilderV2Link,
  DatastoreValueType,
  DatesAfterQuery,
  DatesBeforeQuery,
  EqualitySymbol,
  InnerBuilderV2,
  MaxMatchStatement,
  OrmSearch,
  PaginationQuery,
  PropertyOptions,
  PropertyQuery,
  Query,
  QueryBuilder,
  QueryTokens,
  SortOrder,
  SortStatement,
  SubBuilderFunction,
} from './types'

const THREE = 3

const _objectize = <T>(key: string, value: T) => {
  return value
    ? {
        [key]: value,
      }
    : {}
}

const _additionalLink = (data: OrmSearch): InnerBuilderV2 & BuilderV2Link => {
  const inner = _builderV2(data)
  const partialLink = omit(_link(data), ['and', 'or'])
  // @ts-ignore
  return {
    ...inner,
    ...partialLink,
  }
}

const _link = (data: OrmSearch): BuilderV2Link => {
  return {
    and: () => {
      return _queryBuilder({ ...data, query: data.query.concat('AND') })
    },
    or: () => {
      return _queryBuilder({ ...data, query: data.query.concat('OR') })
    },
    compile: () => {
      return data
    },
    take: (num: number) => {
      return _additionalLink({ ...data, take: take(num) })
    },
    sort: (key: string, order = SortOrder.asc) => {
      return _additionalLink({ ...data, sort: sort(key, order) })
    },
    pagination: (value: any) => {
      return _additionalLink({ ...data, page: pagination(value) })
    },
  }
}

const _canCompile = (obj: any): obj is { compile: () => OrmSearch } => {
  return Boolean(obj.compile)
}

const _builderV2 = (data: OrmSearch): InnerBuilderV2 => {
  const _myProperty = (name: string, value: any, options?: PropertyOptions) => {
    // @ts-ignore
    const p = property(name, value, options)
    return _link(merge(data, { query: data.query.concat(p) }))
  }

  const complex = (subBuilderFunc: SubBuilderFunction) => {
    const subBuilder = _queryBuilder()
    const result = subBuilderFunc(subBuilder)
    if (_canCompile(result)) {
      const queryTokens: [readonly QueryTokens[]] = [result.compile().query]
      return _link(
        merge(data, {
          query: data.query.concat(queryTokens),
        })
      )
    }
    // @ts-ignore
    return _link(merge(data, { query: data.query.concat([result.query]) }))
  }

  const thisDatesBefore = (
    key: string,
    jsDate: Date | string,
    { valueType = DatastoreValueType.string, equalToAndBefore = true } = {}
  ) => {
    const p = datesBefore(key, jsDate, { valueType, equalToAndBefore })
    return _link(merge(data, { query: data.query.concat(p) }))
  }

  const thisDatesAfter = (
    key: string,
    jsDate: Date | string,
    { valueType = DatastoreValueType.string, equalToAndAfter = true } = {}
  ) => {
    const p = datesAfter(key, jsDate, { valueType, equalToAndAfter })
    return _link(merge(data, { query: data.query.concat(p) }))
  }

  return {
    datesBefore: thisDatesBefore,
    datesAfter: thisDatesAfter,
    complex,
    property: _myProperty,
  }
}

const _queryBuilder = (
  data: Partial<OrmSearch> | undefined = undefined
): QueryBuilder => {
  const theData = merge(
    {
      query: [],
    },
    data
  )
  const builder = _builderV2(theData)
  const linkData = _additionalLink(theData)
  // @ts-ignore
  return {
    ...builder,
    ...linkData,
    compile: () => {
      return {
        ..._objectize('take', theData.take),
        ..._objectize('sort', theData.sort),
        ..._objectize('page', theData.page),
        query: [],
      } as OrmSearch
    },
  }
}

/**
 * Creates a property query.
 * @param key - The property's name/key/column to match on
 * @param value - The value to match
 * @param options - Additional options for changing this property query.
 */
const property = (
  key: string,
  value: any,
  options: PropertyOptions = {}
): PropertyQuery => {
  const {
    equalitySymbol = EqualitySymbol.eq,
    caseSensitive,
    startsWith,
    endsWith,
    type,
  } = options
  const typeToUse = type || DatastoreValueType.string
  if (!AllowableEqualitySymbols.includes(equalitySymbol)) {
    throw new Error(`${equalitySymbol} is not a valid symbol`)
  }
  if (
    equalitySymbol !== EqualitySymbol.eq &&
    typeToUse === DatastoreValueType.string
  ) {
    throw new Error(`Cannot use a non = symbol for a string type`)
  }

  const propertyEntry: PropertyQuery = {
    type: 'property',
    key,
    value,
    valueType: typeToUse,
    equalitySymbol,
    options: {
      ..._objectize('caseSensitive', caseSensitive),
      ..._objectize('startsWith', startsWith),
      ..._objectize('endsWith', endsWith),
    },
  }
  return propertyEntry
}

/**
 * Limits the number of results to the provided count.
 * @param max - The maximum results to find
 */
const take = (max: number): MaxMatchStatement => {
  const parsed = parseInt(`${max}`, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Number "${max}" is not integerable`)
  }
  return parsed
}

/**
 * Creates a sort query
 * @param key - The key to sort on
 * @param order - The order of the sort.
 */
const sort = (
  key: string,
  order: SortOrder | undefined = SortOrder.asc
): SortStatement => {
  if (order !== SortOrder.asc && order !== SortOrder.dsc) {
    throw new Error('Sort must be either asc or dsc')
  }
  return {
    key,
    order,
  }
}

/**
 * Creates a pagination query.
 * @param value - Anything
 */
const pagination = (value: any): PaginationQuery => {
  return value
}

/**
 * Creates a query that looks at dated objects after the given date.
 * @param key - The property's key
 * @param jsDate - The date value being examined
 * @param options - Additional options
 */
const datesAfter = (
  key: string,
  jsDate: Date | string,
  options: { valueType: DatastoreValueType; equalToAndAfter: boolean } = {
    valueType: DatastoreValueType.string,
    equalToAndAfter: true,
  }
): DatesAfterQuery => {
  const { valueType = DatastoreValueType.string, equalToAndAfter = true } =
    options
  return {
    type: 'datesAfter',
    key,
    date: isDate(jsDate) ? jsDate.toISOString() : jsDate,
    valueType,
    options: {
      equalToAndAfter,
    },
  }
}

/**
 * Determines if the object is a Date
 * @param obj - Date or string
 */
const isDate = (obj: Date | string): obj is Date => {
  // @ts-ignore
  return Boolean(obj.toISOString)
}

/**
 * Creates a search query that looks at dates before the given date.
 * @param key - The property's key
 * @param jsDate - The date value being examined.
 * @param options - Additional options
 */
const datesBefore = (
  key: string,
  jsDate: Date | string,
  options: { valueType: DatastoreValueType; equalToAndBefore: boolean } = {
    valueType: DatastoreValueType.string,
    equalToAndBefore: true,
  }
): DatesBeforeQuery => {
  const { valueType = DatastoreValueType.string, equalToAndBefore = true } =
    options
  return {
    type: 'datesBefore',
    key,
    date: isDate(jsDate) ? jsDate.toISOString() : jsDate,
    valueType,
    options: {
      equalToAndBefore,
    },
  }
}

/**
 * Creates a builder that can create search queries.
 * This is a structured way to build search queries.
 */
const queryBuilder = (): QueryBuilder => {
  return _queryBuilder()
}

/**
 * Determines if the token is an Orm Property based statement
 * @param value
 */
const isPropertyBasedQuery = (value: any): value is Query => {
  if (!value || !value.type) {
    return false
  }
  return (
    value.type === 'property' ||
    value.type === 'datesBefore' ||
    value.type === 'datesAfter'
  )
}

/**
 * Determines if the value is a boolean
 * @param value - The value to examine.
 */
const isALinkToken = (value: any): value is BooleanQuery => {
  if (!value) {
    return false
  }
  if (typeof value !== 'string') {
    return false
  }
  value = value.toLowerCase()
  return value === 'and' || value === 'or'
}

/**
 * Creates an AND
 */
const and = () => 'AND'

/**
 * Creates an OR
 */
const or = () => 'OR'

/**
 * A helper query that is text based.
 * @param key - The property key/name
 * @param value - The value to match
 * @param options - Additional text based options
 */
const textQuery = (
  key: string,
  value: string | undefined | null,
  options?: Omit<Partial<PropertyOptions>, 'type' | 'equalitySymbol'>
) =>
  property(
    key,
    value,
    Object.assign({}, options, {
      equalitySymbol: undefined,
      type: DatastoreValueType.string,
    })
  )

/**
 * A helper query that is number based.
 * @param key - The property key/name
 * @param value - The value to match
 * @param equalitySymbol - A matching symbol for the number
 */
const numberQuery = (
  key: string,
  value: number | string | undefined | null,
  equalitySymbol: EqualitySymbol = EqualitySymbol.eq
) =>
  property(key, value, {
    equalitySymbol,
    type: DatastoreValueType.number,
  })

/**
 * A helper query that is for boolean values.
 * @param key - The property key/name
 * @param value - The value to match
 */
const booleanQuery = (key: string, value: boolean | undefined | null) =>
  property(key, value, {
    type: DatastoreValueType.boolean,
    equalitySymbol: EqualitySymbol.eq,
  })

/**
 * A useful utility for processing {@link QueryTokens} with a {@link DatastoreAdapter}
 * Takes the first 3 values (property, LINK, property) and then shifts the list left by 2, so that it can create another property, LINK, property
 * @param data - The list of values
 */
const threeitize = <T>(data: T[]): T[][] => {
  if (data.length === 0 || data.length === 1) {
    return []
  }
  if (data.length % 2 === 0) {
    throw new Error('Must be an odd number of 3 or greater.')
  }
  const three = data.slice(0, THREE)
  const rest = data.slice(2)
  const moreThrees = threeitize(rest)
  return [three, ...moreThrees]
}

export {
  queryBuilder,
  take,
  pagination,
  sort,
  property,
  and,
  or,
  isALinkToken,
  isPropertyBasedQuery,
  datesBefore,
  datesAfter,
  textQuery,
  numberQuery,
  booleanQuery,
  threeitize,
}
