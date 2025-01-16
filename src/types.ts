import { OpenAPIV3_1 } from 'openapi-types'

/**
 * A function that returns the value, or just the value
 */
type MaybeFunction<T> = T | (() => T)

/**
 * The data or a promise that returns the data
 */
type MaybePromise<T> = T | Promise<T>

/**
 * The value or null
 */
type Nullable<T> = T | null

/**
 * The value, or undefined
 */
type Maybe<T> = T | undefined

/**
 * The value or an array of the types of value
 */
type Arrayable<T> = T | readonly T[]

/**
 * A JSON compliant object.
 */
type JsonObj = Readonly<{
  [s: string]: JsonAble | null
}>

/**
 * A description of valid json values.
 */
type JsonAble =
  | Arrayable<JsonObj>
  | readonly (number | string | boolean)[]
  | number
  | string
  | boolean
  | null

/**
 * This is a fully Json compliant version of a DataDescription
 */
type JsonifiedData<T extends DataDescription> = {
  readonly [P in keyof T]: JsonAble
}

/**
 * Removes the promise over a value
 */
type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never

/**
 * Removes promises from every property of an object.
 */
type RemovePromises<T extends object> = {
  [K in keyof T as T[K] extends Promise<any> ? K : never]: Unpromise<
    // TODO: Remove
    // @ts-ignore
    //ReturnType<T[K]>
    T[K]
  >
} & {
  [K in keyof T as T[K] extends Promise<any> ? never : K]: T[K]
}

/**
 * The types that are allowed in a choice.
 */
type ChoiceTypes = null | string | number | boolean

/**
 * A Model Reference that is only string|number|undefined|null
 */
type FlattenModelReferences<TData extends DataDescription> = {
  [K in keyof TData as TData[K] extends ModelInstance<any>
    ? never
    : K]: TData[K]
} & {
  [K in keyof TData as TData[K] extends ModelInstance<TData>
    ? K
    : never]: PrimaryKeyType
}

/**
 * The result of a "toObj()" call. See {@link ModelInstance.toObj}
 * This is guaranteed to be JSON compliant.
 */
type ToObjectResult<TData extends DataDescription> = RemovePromises<
  FlattenModelReferences<TData>
>

/**
 * A function that will provide a JSON compliant representation of the data.
 * Useful for saving in a database, or sending out over a network.
 */
type ToObjectFunction<TData extends DataDescription> = <
  R extends TData | JsonifiedData<TData> = JsonifiedData<TData>,
>() => Promise<ToObjectResult<R>>

/**
 * Getter functions that provide access to the value of a property of an instance.
 */
type PropertyGetters<TData extends DataDescription> = {
  readonly [PropertyKey in keyof Required<TData>]: () => TData[PropertyKey]
}

/**
 * The most basic description of data supported by this framework.
 * This includes all of JSON and additional functionality for referenced models.
 */
type DataDescription = Readonly<{
  [s: string]:
    | Promise<PrimaryKeyType>
    | Arrayable<number>
    | Arrayable<string>
    | Arrayable<boolean>
    | Arrayable<null>
    | Arrayable<DataDescription>
    | Arrayable<Date>
    | Arrayable<undefined>
    | ModelReference<any>
    | Arrayable<JsonAble>
}>

/**
 * These are the allowable types for setting a property of data to.
 */
type DataValue = MaybePromise<
  | Arrayable<JsonAble>
  | (() => DataValue) // A lazy function that provides a value.
  | Arrayable<null>
  | Arrayable<undefined>
  | Arrayable<Date>
  | Arrayable<DataDescription>
>

/**
 * Additional context to a validation. Sometimes there are other validation information needed than what can be provided within a model itself.
 */
type ValidatorContext = Readonly<Record<string, any>>

/**
 * The response to a validation attempt at the lowest level. Something is bad (a string), or its good (undefined)
 */
type ValidationErrorResponse = string | undefined

/**
 * A collection of errors for a property or model.
 */
type ValidationErrors = readonly string[]

/**
 * The response to a validation attempt of a model at the lowest level. Something is bad (a string), or its good (undefined)
 */
type ModelError = string | undefined

/**
 * The errors across an entire model. Contains both overall errors, as well as individualized property errors.
 */
type ModelErrors<TData extends DataDescription> = {
  readonly [Property in keyof TData]: readonly string[] | undefined
} & Readonly<{ overall?: readonly string[] | undefined }>

/**
 * The most flexible representation of a Property Validator.
 */
type PropertyValidatorComponentTypeAdvanced<
  TValue,
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = (
  /**
   * The raw value being evaluated.
   */
  value: TValue,
  /**
   * The model instance for context.
   */
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>,
  /**
   * An already JSONified version of the model. This is a convenience so toObj() does not need to be called so frequently.
   */
  instanceData: ToObjectResult<TData>,
  /**
   * Additional outside context to help with validation. (In most cases this is never used).
   */
  context: ValidatorContext
) => ValidationErrorResponse

/**
 * A Property Validator that does not use Promises
 */
type PropertyValidatorComponentSync<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = PropertyValidatorComponentTypeAdvanced<
  any,
  TData,
  TModelExtensions,
  TModelInstanceExtensions
>

/**
 * A simple property validator that just looks at the value.
 */
type ValuePropertyValidatorComponent<TValue extends Arrayable<DataValue>> = (
  value: TValue
) => ValidationErrorResponse

/**
 * A property validator that returns a promise.
 */
type PropertyValidatorComponentAsync<
  TData extends DataDescription,
  TModelExtensions extends object,
  TModelInstanceExtensions extends object,
> = (
  value: Arrayable<DataValue>,
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>,
  instanceData: ToObjectResult<TData>,
  context: ValidatorContext
) => Promise<ValidationErrorResponse>

/**
 * A property validator that is either Sync or Async.
 */
type PropertyValidatorComponent<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> =
  | PropertyValidatorComponentSync<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  | PropertyValidatorComponentAsync<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >

/**
 * The validator for an entire property. This is composed of multiple underlying validators that all get executed and then assembled together.
 */
type PropertyValidator<TData extends DataDescription> = (
  /**
   * The instance data to compare
   */
  instanceData: ToObjectResult<TData>,
  /**
   * Additional context for validating.
   */
  context: ValidatorContext
) => Promise<ValidationErrors>

/**
 * The component of a Model Validator. These are combined together to create a single model validator.
 */
type ModelValidatorComponent<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = (
  /**
   * An instance of the model.
   */
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>,
  /**
   * The JSONified version of the model.
   */
  instanceData: ToObjectResult<TData>,
  /**
   * Additional context that may assist with validating. (Not normally used).
   */
  context: ValidatorContext
) => Promise<ModelError>

/**
 * A function that will get the value of a property.
 * Depending on what the property is, it'll either be a primitive value
 * or it'll be a referenced model.
 */
type ValueGetter<
  /**
   * The type of value
   */
  TValue extends Arrayable<DataValue>,
  /**
   * The value existing within a specific type of data.
   */
  TData extends DataDescription = DataDescription,
  /**
   * Any additional model extensions.
   */
  TModelExtensions extends object = object,
  /**
   * Any additional model instance extensions.
   */
  TModelInstanceExtensions extends object = object,
> = () => MaybePromise<
  TValue | ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
>

/**
 * An instance of a property. This is used to describe a property in depth as well as provide functionality like validating values.
 */
type PropertyInstance<
  /**
   * The type of value that the property represents.
   */
  TValue extends Arrayable<DataValue>,
  /**
   * The data that the property sits within.
   */
  TData extends DataDescription = DataDescription,
  /**
   * Any additional model extensions.
   */
  TModelExtensions extends object = object,
  /**
   * Any additional model instance extensions.
   */
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  /**
   * Gets the configuration passed into the property constructor.
   */
  getConfig: () => object
  /**
   * Gets available choices for limiting the value of this property.
   */
  getChoices: () => readonly ChoiceTypes[]
  /**
   * If there is a default value
   */
  getDefaultValue: () => TValue
  /**
   * If there is a constant value that never changes. (This is used above all else).
   */
  getConstantValue: () => TValue
  /**
   * Gets the ValueType of the property. Unless custom properties are used, the value is a {@link ValueType}.
   * Otherwise the value could be string for custom types.
   */
  getPropertyType: () => ValueType | string
  /**
   * Creates a value getter.
   * @param value - The type of value
   * @param modelData - The type of data.
   * @param modelInstance - An instance of the model that has the data.
   */
  createGetter: (
    value: TValue,
    modelData: TData,
    modelInstance: ModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => ValueGetter<TValue, TData, TModelExtensions, TModelInstanceExtensions>
  /**
   * Gets a validator for the property. This is not normally used.
   * Instead for validation look at {@link ModelInstance.validate}
   * @param valueGetter - The getter for the value.
   */
  getValidator: (
    valueGetter: ValueGetter<
      TValue,
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => PropertyValidator<TData>
}>

/**
 * A list of properties that make up a model.
 */
type PropertiesList<TData extends DataDescription> = {
  readonly [P in keyof TData as TData[P] extends Arrayable<DataValue>
    ? P
    : // TODO: Remove
      //: never]: PropertyInstance<T[P]>
      //readonly [P in keyof T as T[P]]: PropertyInstance<any>
      never]: PropertyInstance<any>
}

/**
 * An extends a Property to add additional functions helpful for dealing with
 * referenced models.
 */
interface ModelReferencePropertyInstance<
  TData extends DataDescription,
  TProperty extends Arrayable<DataValue>,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> extends PropertyInstance<TProperty> {
  readonly getReferencedId: (
    instanceValues: ModelReference<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => Maybe<PrimaryKeyType>
  readonly getReferencedModel: () => ModelType<
    TData,
    TModelExtensions,
    TModelInstanceExtensions
  >
}

/**
 * A property of a model that references another model instance.
 * This is a basic implementation of a "foreign key".
 * The value of this property can be either a key type (string|number), or a model instance, or the model data itself. It depends on the ModelInstanceFetcher.
 */
type ModelReference<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = MaybePromise<
  | TData
  | ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  | ToObjectResult<TData>
  | PrimaryKeyType
>

/**
 * Common property validator choices.
 */
type CommonValidators = Readonly<{
  required?: boolean
  isInteger?: boolean
  isNumber?: boolean
  isString?: boolean
  isArray?: boolean
  isBoolean?: boolean
}>

/**
 * Standard configuration options for properties.
 */
type PropertyConfigOptions<TValue extends Arrayable<DataValue>> = Readonly<
  Partial<{
    /**
     * The value type of the property.
     */
    type: ValueType | string
    /**
     * A default value if one is never given.
     */
    defaultValue: TValue
    /**
     * Determines if this value needs to go through denormalization.
     */
    isDenormalized: boolean
    /**
     * The value of the property (if provided)
     */
    value: TValue
    /**
     * Possible limiting choices of what the property can be.
     */
    choices: readonly ChoiceTypes[]
    /**
     * A lazy loading method, which will only run when the value is actually retrieved.
     * IMPORTANT: Do not include promises as part of this because they are not thread safe.
     * @param value - The current value
     * @param modelData - The models current data
     */
    lazyLoadMethod: <TData extends DataDescription>(
      value: TValue,
      modelData: TData
    ) => TValue
    /**
     * A thread safe (Atomic) version of lazyLoadMethod. Use this for all lazy loadings that requires Promises.
     * @param value - The current value
     * @param modelData - The models current data.
     */
    lazyLoadMethodAtomic: <TData extends DataDescription>(
      value: TValue,
      modelData: TData
    ) => Promise<TValue>
    /**
     * An optional function that can select a "part" of the value to return.
     * @param instanceValue
     */
    valueSelector: (instanceValue: MaybePromise<TValue>) => TValue
    /**
     * Additional validators for the property.
     */
    validators: readonly PropertyValidatorComponent<any>[]
    /**
     * The maximum length of the value. (Drives validation)
     */
    maxLength: number
    /**
     * The minimum length of the value. (Drives validation)
     */
    minLength: number
    /**
     * The maximum size of the value. (Drives validation)
     */
    maxValue: number
    /**
     * The minimum size of the value. (Drives validation)
     */
    minValue: number
    /**
     * If the value should be created automatically. Used in date creation.
     */
    autoNow: boolean
    /**
     * A fetcher used for getting model references.
     * This configuration item is used within the {@link AdvancedModelReferenceProperty} and any other property
     * that is lazy loading (atomically) models.
     */
    fetcher: ModelInstanceFetcher
  }>
>

/**
 * A function that has the ability to fetch an instance of a model.
 * This is the backbone that provides the "ModelReference" functionality.
 * This is useful downstream for building ORMs and other systems that require
 * hydrating "foreign key" models.
 */
type ModelInstanceFetcher<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  model: ModelType<TData, TModelExtensions, TModelInstanceExtensions>,
  primaryKey: PrimaryKeyType
) =>
  | Promise<
      | TData
      | ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
      | ToObjectResult<TData>
    >
  | Promise<null>
  | Promise<undefined>

/**
 * The configurations for a property.
 */
type PropertyConfig<TValue extends Arrayable<DataValue>> =
  | (PropertyConfigOptions<TValue> & CommonValidators)
  | undefined

/**
 * Depending on your system a primary key is either a string or a number.
 */
type PrimaryKeyType = string | number

/**
 * A function that has the ability to build models. (not instances of models)
 * This is actually a "factory of model factories" but we're just calling it a ModelFactory.
 */
type ModelFactory<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  modelDefinition: MinimalModelDefinition<TData>,
  options?: ModelOptions<TData, TModelExtensions, TModelInstanceExtensions>
) => ModelType<TData, TModelExtensions, TModelInstanceExtensions>

/**
 * Input parameters to a model's create function.
 */
type CreateParams<TData extends DataDescription> = TData | RemovePromises<TData>

/**
 * Higher Level Methods associated with a model based API. CRUDS
 */
enum ApiMethod {
  create = 'create',
  retrieve = 'retrieve',
  update = 'update',
  delete = 'delete',
  search = 'search',
}

/**
 * Basic REST information for a model.
 */
type RestInfo = {
  /**
   * The endpoint (not including the base domain). This format can include ":id" to describe a specific instance id.
   * Example: /api/v2/whatever-i-want/model/:id
   * The following are the defaults by API method:
   * {
   *   create: '/namespace/app',
   *   retrieve: '/namespace/app/id',
   *   update: '/namespace/app/id',
   *   delete: '/namespace/app/id',
   *   search: '/namespace/app/search',
   *   }
   */
  endpoint: string
  /**
   * Security descriptions
   */
  security: readonly OpenAPIV3_1.SecurityRequirementObject[]
  /**
   * The HTTP Method. The following are the defaults used:
   * {
   *   create: post,
   *   retrieve: get,
   *   update: put,
   *   delete: delete,
   *   search: post,
   * }
   */
  method: OpenAPIV3_1.HttpMethods
}

/**
 * Functional API documentation for a given model. This allows the automatic creation of tools and documentation such as OpenApi specs.
 * This uses the standard "CRUDS" api methods that you might see on any API involving a model.
 * Create, Retrieve, Update, Delete, Search
 */
type ApiInfo = {
  /**
   * If true, no api information should be published. This means, that no code-generation tool should produce
   * any api code/documentation as it relates to this model. If you want partial publishing, look at "onlyPublish"
   */
  noPublish: boolean
  /**
   * Similar to noPublish, but granular. This will only publish the methods shown. If noPublish is provided,
   * this will be empty. If onlyPublish is empty, and noPublish is false, then all methods will be published.
   */
  onlyPublish: readonly ApiMethod[]
  /**
   * A description of each Api method to its rest info.
   * If this is not manually overrided then defaults are used for each.
   */
  apiToRestInfo: Record<ApiMethod, RestInfo>
  /**
   * Create normally can support bulk inserts (more than one). If this property is true, create will only handle "one" model at a time.
   */
  createOnlyOne: boolean
}

/**
 * Expressively defines metadata for a given model.
 */
type ModelDefinition<TData extends DataDescription> = Readonly<{
  /**
   * The primary name for the model and instances of the model. This should be a name for multiple of the model instances.
   */
  pluralName: string
  /**
   * The name that this model exists within, such as an app.
   */
  namespace: string
  /**
   * The properties that make up the model.
   */
  properties: PropertiesList<Required<TData>>
  /**
   * The name of the property that has the unique id for the model. Used to uniquely identify instances of this model vs other ones.
   */
  primaryKeyName: string
  /**
   * Validators of the overall model (rather than properties)
   */
  modelValidators: readonly ModelValidatorComponent<TData>[]
  /**
   * The name for a model/instance where there is one of them.
   */
  singularName: string
  /**
   * A text used for displaying the name of the model in a UI.
   */
  displayName: string
  /**
   * A helpful human-readable description that explains what the model is and what it is used for.
   */
  description: string
  /**
   * The raw api information provided in. When looking for a fleshed out version of this data
   * look at {@link ModelType.getApiInfo}
   */
  apiInformation?: Partial<ApiInfo>
}>

/**
 * The most minimum information needed to create a model.
 */
type MinimalModelDefinition<TData extends DataDescription> = Partial<
  ModelDefinition<TData>
> & {
  /**
   * The namespace (or app) that this model is under.
   */
  namespace: string
  /**
   * The plural name of this model. (Recommended to be TitleCase)
   */
  pluralName: string
  /**
   * The properties that represent each of the values of the data.
   */
  properties: PropertiesList<Required<TData>>
}

/**
 * Represents a Model. A Model creates instances (ModelInstance) as well as describes generally about the data. (ModelDefinition).
 * @typeParam TData - The type of data
 * @typeParam TModelExtensions - Extensions on the model.
 * @typeParam TModelInstanceExtensions - Extensions on the instances produced by this model.
 */
type ModelType<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  /**
   * This is a unique name combining namespace + pluralName. This can be used as a key to uniquely identify
   * this model across an entire system.
   * Example:
   * pluralName=MyModels
   * namespace=@my-package/namespace
   *
   * Return: '@my-package/namespace-my-models'
   */
  getName: () => string
  /**
   * Gets the metadata that describes the model.
   */
  getModelDefinition: () => ModelDefinition<TData>
  /**
   * Gets the primary key of instance data. This helpful method shortcuts having to figure out the primaryKey's name
   * and then reaching inside the instance data to get the primary key.
   * @param t The underlying instance data that has the primary key.
   */
  getPrimaryKey: (instanceData: TData | ToObjectResult<TData>) => PrimaryKeyType
  /**
   * Gets the options that were passed into the model.
   */
  getOptions: () => object & ModelOptions<TData>
  /**
   * Gets the Api Information on the model.
   *
   * This will take what is manually provided via the ModelDefinition and autopopulate everything that is possible
   * with default values, or values that make sense based on the ApiInformation provided.
   */
  getApiInfo: () => Required<ApiInfo>
  /**
   * Creates an instance of this model with the data that is provided.
   *
   * @typeParam IgnorePrimaryKey - One or more properties to ignore type restrictions on. This is extremely useful for primaryKeys that have not been created yet, or other generated properties (that are required instead of optional).
   * @param data - The data that makes up an instance of the model.
   * NOTE: A tradeoff was made between supporting the DataDescription vs a ToObjectReturn<DataDescription>. One or the other could be supported, but not both.
   * In order to support executing create() while passing in data that comes from ".toObj()" we recommend using that case feature of toObj().
   */
  create: <IgnoreProperties extends string = ''>(
    data: CreateParams<Omit<TData, IgnoreProperties>>
  ) => ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
}> &
  TModelExtensions

/**
 * A function that can provide a model reference.
 */
type ModelReferenceFunctions = Record<string, () => Maybe<PrimaryKeyType>>

/**
 * Records of Property name to Validator.
 */
type PropertyValidators<TData extends DataDescription> = Readonly<
  Record<string, PropertyValidator<TData>>
>

/**
 * An instance of a Model. This "wrapper" fully embodies the power of the framework, and provides the most enrichment of a single piece of a data possible.
 * @typeParam TData - The type of data
 * @typeParam TModelExtensions - Extensions on the overall model.
 * @typeParam TModelInstanceExtensions - Extensions on all instances of a model.
 */
type ModelInstance<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  /**
   * Gets the value of individual properties on the instance.
   * These are memoized.
   */
  get: PropertyGetters<TData>
  getReferences: () => ModelReferenceFunctions
  /**
   * Gets a basic representation of the data.
   * This function is memoized.
   */
  toObj: ToObjectFunction<TData>
  getPrimaryKey: () => PrimaryKeyType
  getValidators: () => PropertyValidators<TData>
  /**
   * Runs validation against this instance.
   * This function is memoized.
   * @param options
   */
  validate: (options?: object) => Promise<ModelErrors<TData> | undefined>
  getModel: () => ModelType<TData, TModelExtensions, TModelInstanceExtensions>
}> &
  TModelInstanceExtensions

/**
 * Options to pass into model generation.
 */
type ModelOptions<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Record<string, any> &
  Readonly<{
    instanceCreatedCallback?: Arrayable<
      (
        instance: ModelInstance<
          TData,
          TModelExtensions,
          TModelInstanceExtensions
        >
      ) => void
    >
  }>

/**
 * A function that can calculate a denormalized value. This is very useful for property values that have very complicated and often expensive calculations (but should be calculated once).
 */
type CalculateDenormalization<
  TValue extends DataValue,
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = (
  modelData: TData,
  modelInstance: ModelInstance<
    TData,
    TModelExtensions,
    TModelInstanceExtensions
  >
) => MaybePromise<TValue | undefined>

/**
 * Higher level value types that describe what the value of a property is.
 * These values can be used to generate expressive APIs as well as GUI elements.
 */
enum ValueType {
  UniqueId = 'UniqueId',
  Date = 'Date',
  Datetime = 'Datetime',
  Array = 'Array',
  Reference = 'Reference',
  Integer = 'Integer',
  Text = 'Text',
  BigText = 'BigText',
  Number = 'Number',
  Object = 'Object',
  Email = 'Email',
  Boolean = 'Boolean',
}

/**
 * The most primitive data types that can be used.
 */
enum PrimitiveValueType {
  boolean = 'boolean',
  string = 'string',
  object = 'object',
  number = 'number',
  integer = 'integer',
}

/**
 * Dates can either be a Date or a string
 */
type DateValueType = Date | string

export {
  PrimitiveValueType,
  ValueType,
  MaybeFunction,
  Maybe,
  MaybePromise,
  Nullable,
  Arrayable,
  JsonAble,
  ToObjectFunction,
  ToObjectResult,
  ModelInstance,
  ModelType,
  PropertyValidatorComponent,
  PropertyValidatorComponentSync,
  PropertyValidatorComponentAsync,
  PropertyValidator,
  ModelValidatorComponent,
  PropertyInstance,
  PropertyConfig,
  DataValue,
  ValueGetter,
  ModelReference,
  ModelDefinition,
  ModelOptions,
  ModelReferencePropertyInstance,
  PropertyGetters,
  PropertyValidators,
  PropertyValidatorComponentTypeAdvanced,
  DataDescription,
  ModelReferenceFunctions,
  ModelErrors,
  PrimaryKeyType,
  ModelFactory,
  ModelInstanceFetcher,
  CreateParams,
  ValidatorContext,
  ValuePropertyValidatorComponent,
  ValidationErrors,
  ModelError,
  JsonifiedData,
  JsonObj,
  CalculateDenormalization,
  PropertiesList,
  MinimalModelDefinition,
  ChoiceTypes,
  PropertyConfigOptions,
  ValidationErrorResponse,
  CommonValidators,
  DateValueType,
  ApiInfo,
  RestInfo,
  ApiMethod,
}
