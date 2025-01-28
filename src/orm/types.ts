import {
  Arrayable,
  DataValue,
  Maybe,
  ModelInstance,
  ModelType,
  DataDescription,
  PrimaryKeyType,
  MinimalModelDefinition,
  PropertyConfig,
  ValidatorContext,
  ToObjectResult,
  ModelInstanceFetcher,
  ModelFactoryOptions,
} from '../types'

/**
 * Equals symbols for doing database matching
 */
enum EqualitySymbol {
  // Equals
  eq = '=',
  // Less than
  lt = '<',
  // Equal to or less than
  lte = '<=',
  // Greater than
  gt = '>',
  // Equal to or greater than
  gte = '>=',
}

/**
 * The value types that map to database types.
 */
enum DatastoreValueType {
  string = 'string',
  number = 'number',
  date = 'date',
  object = 'object',
  boolean = 'boolean',
}

/**
 * A list of allowable equality symbols.
 */
const AllowableEqualitySymbols = Object.values(EqualitySymbol)

/**
 * A function that can save.
 */
type SaveMethod<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  /**
   * An instance to save
   */
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<
  OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
>

/**
 * A method that can delete
 */
type DeleteMethod<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<void>

/**
 * A function that allows overriding the save functionality for a specific model.
 */
type SaveOverride<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  existingSave: SaveMethod<TModelExtensions, TModelInstanceExtensions>,
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<
  OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
>

/**
 * A function that allows overriding the delete functionality for a specific model.
 */
type DeleteOverride<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  existingDelete: DeleteMethod<TModelExtensions, TModelInstanceExtensions>,
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<void>

/**
 * A result of an ORM search.
 * @interface
 */
type OrmSearchResult<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  /**
   * A list of instances
   */
  instances: readonly OrmModelInstance<
    TData,
    TModelExtensions,
    TModelInstanceExtensions
  >[]
  /**
   * An optional page value. The exact structure is provided by the datastore itself.
   */
  page?: any
}>

/**
 * ORM based ModelFactory extensions.
 * @interface
 */
type OrmModelFactoryOptionsExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  /**
   * Optional: The save function to override.
   */
  save?: SaveOverride<TModelExtensions, TModelInstanceExtensions>
  /**
   * Optional: The delete function to override.
   */
  delete?: DeleteOverride<TModelExtensions, TModelInstanceExtensions>
}>

/**
 * Extensions to the Model type
 * @interface
 */
type OrmModelExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  /**
   * Save the model
   * @param instance - The instance to save.
   */
  save: <TData extends DataDescription>(
    instance: OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => Promise<
    OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  >
  /**
   * Deletes an instance by its id.
   * @param id - The id to delete
   */
  delete: (id: PrimaryKeyType) => Promise<void>
  /**
   * Attempts to get an instance by its id
   * @param primaryKey
   */
  retrieve: <TData extends DataDescription>(
    primaryKey: PrimaryKeyType
  ) => Promise<
    Maybe<OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>>
  >
  /**
   * Searches instances by the provided search query
   * @param query
   */
  search: <TData extends DataDescription>(
    query: OrmSearch
  ) => Promise<
    OrmSearchResult<
      TData,
      OrmModel<TData, TModelExtensions, TModelInstanceExtensions>
    >
  >
  /**
   * Searches for a single instance with the given query.
   * @param query
   */
  searchOne: <TData extends DataDescription>(
    query: Omit<OrmSearch, 'take'>
  ) => Promise<
    | OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
    | undefined
  >
  /**
   * Creates and saves an instance. An optimization in some databases
   * @param query
   */
  createAndSave: <TData extends DataDescription>(
    data: OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  ) => Promise<
    OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  >
  /**
   * Inserts multiple objects at once. Can often see great optimizations in some databases.
   * @param query
   */
  bulkInsert: <TData extends DataDescription>(
    instances: readonly OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >[]
  ) => Promise<void>
  /**
   * Counts the number of models saved in the database.
   */
  count: () => Promise<number>
}>

/**
 * Instance overrides that give it ORM functions.
 * @interface
 */
type OrmModelInstanceExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  /**
   * Save this model.
   */
  save: <TData extends DataDescription>() => Promise<
    OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  >
  /**
   * Delete this model.
   */
  delete: () => Promise<void>
}>

/**
 * ORM based configurations for a model.
 * @interface
 */
type OrmModelConfigurations = Readonly<{
  /**
   * Validator that there is only a single value in the datastore that has the properties given.
   * Example:
   * ["name", "text"]
   * This will make sure that there can only be a single row in the database that has a unique combination of name and text.
   */
  uniqueTogether?: readonly string[]
}>

/**
 * A minimum orm model definition
 * @interface
 */
type MinimumOrmModelDefinition<TData extends DataDescription> =
  MinimalModelDefinition<TData> & OrmModelConfigurations

/**
 * A model factory that produces ORM based models.
 *
 */
type OrmModelFactory<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
  TModelOptionsExtensions extends object = object,
> = <TData extends DataDescription>(
  /**
   * The model definition for the model
   */
  modelDef: MinimumOrmModelDefinition<TData>,
  /**
   * Additional options for this model.
   */
  options?: ModelFactoryOptions<
    TData,
    OrmModelFactoryOptionsExtensions<
      TModelExtensions,
      TModelInstanceExtensions
    > &
      TModelOptionsExtensions
  >
) => OrmModel<TData, TModelExtensions, TModelInstanceExtensions>

/**
 * A search result from a datastore
 * @interface
 */
type DatastoreSearchResult<T extends DataDescription> = Readonly<{
  /**
   * An array of objects that represent the data from the datastore.
   */
  instances: readonly ToObjectResult<T>[]
  /**
   * Any pagination information.
   */
  page?: any
}>

/**
 * A model that has ORM functions attached.
 * @interface
 */
type OrmModel<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = ModelType<
  TData,
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>
>

/**
 * A Model Instance with ORM functions attached.
 * @interface
 */
type OrmModelInstance<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = ModelInstance<
  TData,
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>
>

/**
 * An interface that describes a datastore. By implementing this interface, databases can be swapped.
 * @interface
 */
type DatastoreAdapter = Readonly<{
  /**
   * Saving a model.
   * @param instance
   */
  save: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  ) => Promise<ToObjectResult<TData>>
  /**
   * Deleting an instance.
   * @param model
   * @param id
   */
  delete: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>,
    id: PrimaryKeyType
  ) => Promise<void>
  /**
   * Attempts to retrieves an instance.
   * @param model
   * @param primaryKey
   */
  retrieve: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>,
    primaryKey: PrimaryKeyType
  ) => Promise<Maybe<ToObjectResult<TData>>>
  /**
   * Searches for instances by a query.
   * @param model
   * @param query
   */
  search: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>,
    query: OrmSearch
  ) => Promise<DatastoreSearchResult<TData>>
  /**
   * Optional: An optimized bulkInsert function. (Highly recommended)
   * @param model
   * @param instances
   */
  bulkInsert?: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>,
    instances: readonly ModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >[]
  ) => Promise<void>
  /**
   * Optional: An optimized createAndSave function.
   * @param instance
   */
  createAndSave?: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  ) => Promise<ToObjectResult<TData>>
  /**
   * Optional: An optimized counting function. Highly recommended.
   * @param model
   */
  count?: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>
  ) => Promise<number>
}>

/**
 * A search that describes a property and its value.
 * @interface
 */
type PropertyQuery = Readonly<{
  /**
   * Distinguishes this as a property  query.
   */
  type: 'property'
  /**
   * The property's key
   */
  key: string
  /**
   * The value to search for.
   */
  value: any
  /**
   * The type of database value.
   */
  valueType: DatastoreValueType
  /**
   * How the value should be compared.
   */
  equalitySymbol: EqualitySymbol
  /**
   * Options for additional matching.
   */
  options: {
    /**
     * Should this be a case sensitive search. (for text)
     */
    caseSensitive?: boolean
    /**
     * Indicates that the value is a "startsWith" query.
     */
    startsWith?: boolean
    /**
     * Indicates that the value is a "endsWith" query.
     */
    endsWith?: boolean
  }
}>

/**
 * A search that looks at dated objects after the given date.
 * @interface
 */
type DatesAfterQuery = Readonly<{
  /**
   * Distinguishes this query
   */
  type: 'datesAfter'
  /**
   * The property's key
   */
  key: string
  /**
   * The date value being examined.
   */
  date: string
  /**
   * The database type.
   */
  valueType: DatastoreValueType
  /**
   * Options for additional searching
   */
  options: {
    /**
     * Should this search be equalsTo as well as after?
     */
    equalToAndAfter: boolean
  }
}>

/**
 * A search query that looks at dates before the given date.
 * @interface
 */
type DatesBeforeQuery = Readonly<{
  /**
   * Distinguishes this query
   */
  type: 'datesBefore'
  /**
   * The property's key.
   */
  key: string
  /**
   * The date value being examined.
   */
  date: string
  /**
   * The database value type.
   */
  valueType: DatastoreValueType
  /**
   * Options for additional searching
   */
  options: {
    /**
     * Should this search be equalsTo as well as before?
     */
    equalToAndBefore: boolean
  }
}>

/**
 * Additional configurations for ORM based properties.
 * @interface
 */
type OrmPropertyConfig<T extends Arrayable<DataValue>> = PropertyConfig<T> &
  Readonly<{
    /**
     * Validator: Checks to make sure that there is only one instance in a datastore that has this property's value.
     * NOTE: The value is a property KEY. Not true or false.
     */
    unique?: string
  }>

/**
 * Additional context that is provided for ORM based instance.
 * @interface
 */
type OrmValidatorContext = Readonly<{
  /**
   * IMPORTANT: Sometimes you do not want to do any ORM based validation because of speed.
   * This disables any orm based validation, and only runs non-orm validation.
   */
  noOrmValidation?: boolean
}> &
  ValidatorContext

/**
 * Options for a property query.
 */
type PropertyOptions = {
  /**
   * Is this a case sensitive search?
   */
  caseSensitive?: boolean
  /**
   * Is the value a startsWith query?
   */
  startsWith?: boolean
  /**
   * Is the value a endsWith query?
   */
  endsWith?: boolean
  /**
   * The type of value
   */
  type?: DatastoreValueType
  /**
   * An equality symbol.
   */
  equalitySymbol?: EqualitySymbol
}

/**
 * An object that has both an Orm Model Factory (that can make Orm Models) as well as a loaded fetcher
 * that can retrieve referenced models as needed. See {@see "functional-models.ModelReference"}
 * @interface
 */
type Orm = {
  /**
   * A model factory that can produce {@link OrmModel}
   */
  Model: OrmModelFactory
  /**
   * A fetcher for use with Model References
   */
  fetcher: ModelInstanceFetcher<OrmModelExtensions, OrmModelInstanceExtensions>
}

/**
 * The sort order.
 */
enum SortOrder {
  asc = 'asc',
  dsc = 'dsc',
}

/**
 * The number of instances to receive back from a query.
 */
type MaxMatchStatement = number

/**
 * Defines how a sort should happen. Which column and what order.
 * @interface
 */
type SortStatement = {
  /**
   * The property's key/name. Also could be a "column"
   */
  key: string
  /**
   * Ascending or Descending sort.
   */
  order: SortOrder
}

/**
 * Pagination can be anything.
 */
type PaginationQuery = any

/**
 * A query to a search function.
 * @interface
 */
type OrmSearch = {
  /**
   * Optional: A number of max records to return.
   */
  take?: MaxMatchStatement
  /**
   * Optional: Sorting.
   */
  sort?: SortStatement
  /**
   * Optional: Pagination information
   */
  page?: PaginationQuery
  /**
   * Optional: Querying tokens.
   */
  query: readonly QueryTokens[]
}

/**
 * Statements that make up the meat of QueryTokens
 */
type Query = PropertyQuery | DatesAfterQuery | DatesBeforeQuery

/**
 * A token type that links two queries together.
 */
type BooleanQuery = 'AND' | 'OR'

/**
 * A generic structure of querys.
 */
type QueryTokens =
  | readonly QueryTokens[][]
  | readonly QueryTokens[]
  | BooleanQuery
  | Query

/**
 * Builder functions that are not property related.
 * @interface
 */
type NonQueryBuilder = Readonly<{
  /**
   * Creates a pagination.
   * @param value - Can be anything
   */
  pagination: (value: any) => BuilderV2Link & InnerBuilderV2
  /**
   * Creates a sort.
   * @param key - The key to sort on
   * @param sortOrder - The order to sort by. Defaults to ascending.
   */
  sort: (key: string, sortOrder?: SortOrder) => BuilderV2Link & InnerBuilderV2
  /**
   * Maximum number of elements to return.
   * @param count - The count
   */
  take: (count: number) => BuilderV2Link & InnerBuilderV2
  /**
   * Compiles the builder into a search query.
   */
  compile: () => OrmSearch
}>

/**
 * An in between or ending type to a builder creating a SearchQuery
 * @interface
 */
type BuilderV2Link = NonQueryBuilder &
  Readonly<{
    /**
     * Links together two or more {@link Query} or complex queries.
     */
    and: () => QueryBuilder
    /**
     * Links together two or more {@link Query} or complex queries.
     */
    or: () => QueryBuilder
  }>

/**
 * A function that can either take a builder or raw QueryTokens[] and create a sub-query.
 * @param builder - Can be either a BuilderV2 or a hand written Query
 **/
type SubBuilderFunction = (
  builder: QueryBuilder
) => Omit<OrmSearch, 'take' | 'sort' | 'page'> | (QueryBuilder | BuilderV2Link)

/**
 * A search builder is a structured way to create a complex query.
 * @interface
 */
type QueryBuilder = InnerBuilderV2 & NonQueryBuilder

/**
 * A builder for version 3.0 search queries.
 * @interface
 */
type InnerBuilderV2 = {
  /**
   * Creates a query that has nested property queries.
   * @param subBuilderFunc - A function that can return a Builder
   */
  complex: (subBuilderFunc: SubBuilderFunction) => BuilderV2Link
  /**
   * Searches for elements that are after the given date.
   * @param key - The property name/key to use.
   * @param jsDate - The date to search.
   * @param options - Additional options.
   */
  datesAfter: (
    key: string,
    jsDate: Date | string,
    options?: { valueType?: DatastoreValueType; equalToAndAfter?: boolean }
  ) => BuilderV2Link
  /**
   * Searches for elements that are before the given date.
   * @param key - The property name/key to use.
   * @param jsDate - The date to search.
   * @param options - Additional options.
   */
  datesBefore: (
    key: string,
    jsDate: Date | string,
    options?: { valueType?: DatastoreValueType; equalToAndBefore?: boolean }
  ) => BuilderV2Link
  /**
   * Search a value
   * @param key - The property name/key to use.
   * @param value - The value to match.
   * @param options - Additional options.
   */
  property: (
    key: string,
    value: any,
    options?: Partial<PropertyOptions>
  ) => BuilderV2Link
}

export {
  PropertyQuery,
  SortStatement,
  DatesAfterQuery,
  DatesBeforeQuery,
  PaginationQuery,
  MaxMatchStatement,
  OrmModel,
  OrmModelInstance,
  DatastoreAdapter,
  OrmModelFactory,
  SaveOverride,
  DeleteOverride,
  OrmPropertyConfig,
  DatastoreSearchResult,
  OrmValidatorContext,
  OrmSearchResult,
  EqualitySymbol,
  DatastoreValueType,
  AllowableEqualitySymbols,
  PropertyOptions,
  Orm,
  OrmModelExtensions,
  OrmModelInstanceExtensions,
  OrmModelFactoryOptionsExtensions,
  MinimumOrmModelDefinition,
  QueryBuilder,
  BuilderV2Link,
  SubBuilderFunction,
  OrmSearch,
  Query,
  BooleanQuery,
  QueryTokens,
  InnerBuilderV2,
  SortOrder,
}
