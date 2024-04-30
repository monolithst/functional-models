/* eslint-disable no-unused-vars */
type MaybeFunction<T> = T | (() => T)
type MaybePromise<T> = T | Promise<T>
type Nullable<T> = T | null
type Maybe<T> = T | undefined | null
type Arrayable<T> = T | readonly T[]
type MaybeLazy<T> = Maybe<Promise<T>>
type JsonObj = Readonly<{
  [s: string]: JsonAble | null
}>
type TypedJsonObj<T extends FunctionalModel> = {
  readonly [P in keyof T]: JsonAble
}

type JsonAble =
  | Arrayable<JsonObj>
  | readonly (number | string | boolean)[]
  | number
  | string
  | boolean
  | null
type VeryPrimitivesTypes = null | string | number | boolean
type toObj<T extends FunctionalModel> = () => Promise<TypedJsonObj<T>>

type PropertyGetters<T extends FunctionalModel> = {
  // NOTE: This is NOT ModelMethodTypes, its getting everything but.
  readonly [Property in keyof T]: () => T[Property]
}

type FunctionalModel = Readonly<{
  [s: string]:
    | Arrayable<number>
    | Promise<number>
    | Arrayable<string>
    | Arrayable<boolean>
    | Arrayable<null>
    | Arrayable<FunctionalModel>
    | Arrayable<Date>
    | Arrayable<undefined>
    | ModelReference<any>
    | Arrayable<JsonAble>
}> &
  Readonly<{ id?: PrimaryKeyType }>

type FunctionalValue = MaybePromise<
  | Arrayable<JsonAble>
  | (() => FunctionalValue)
  | Arrayable<null>
  | Arrayable<undefined>
  | Arrayable<Date>
  | Arrayable<FunctionalModel>
>

type ValidatorConfiguration = Readonly<{
  [s: string]: any
}>

type ValidationErrorResponse = string | undefined
type ValidationErrors = readonly string[]
type ModelError = string | undefined
type ModelErrors<T extends FunctionalModel> = {
  readonly [Property in keyof T]: readonly string[] | undefined
} & Readonly<{ overall?: readonly string[] | undefined }>

type PropertyValidatorComponentTypeAdvanced<
  TValue,
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = (
  value: TValue,
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => ValidationErrorResponse

type PropertyValidatorComponentSync<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = PropertyValidatorComponentTypeAdvanced<any, T, TModel, TModelInstance>

type ValuePropertyValidatorComponent<T extends Arrayable<FunctionalValue>> = (
  value: T
) => ValidationErrorResponse

type PropertyValidatorComponentAsync<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = (
  value: Arrayable<FunctionalValue>,
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrorResponse>

type PropertyValidatorComponent<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> =
  | PropertyValidatorComponentSync<T, TModel, TModelInstance>
  | PropertyValidatorComponentAsync<T, TModel, TModelInstance>

type PropertyValidator<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = (
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrors>

type ModelValidatorComponent<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = (
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ModelError>

type ValueGetter<
  TValue extends Arrayable<FunctionalValue>,
  T extends FunctionalModel = FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = () => MaybePromise<TValue | TModelInstance>

type PropertyInstance<
  TValue extends Arrayable<FunctionalValue>,
  T extends FunctionalModel = FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = Readonly<{
  getConfig: () => object
  getChoices: () => readonly VeryPrimitivesTypes[]
  getDefaultValue: () => TValue
  getConstantValue: () => TValue
  getPropertyType: () => string
  createGetter: (
    value: TValue,
    modelData: T,
    modelInstance: TModelInstance
  ) => ValueGetter<TValue, T, TModel, TModelInstance>
  getValidator: (
    valueGetter: ValueGetter<TValue, T, TModel, TModelInstance>
  ) => PropertyValidator<T, TModel, TModelInstance>
}>

type PropertiesList<T extends FunctionalModel> = {
  readonly [P in keyof T as T[P] extends Arrayable<FunctionalValue>
    ? P
    : never]: PropertyInstance<any>
}

interface ModelReferencePropertyInstance<
  T extends FunctionalModel,
  TProperty extends Arrayable<FunctionalValue>,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> extends PropertyInstance<TProperty> {
  readonly getReferencedId: (
    instanceValues: ModelReference<T, TModel, TModelInstance>
  ) => Maybe<PrimaryKeyType>
  readonly getReferencedModel: () => TModel
}

type ModelReference<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = T | TModelInstance | TypedJsonObj<T> | PrimaryKeyType

type DefaultPropertyValidators = Readonly<{
  required?: boolean
  isInteger?: boolean
  isNumber?: boolean
  isString?: boolean
  isArray?: boolean
  isBoolean?: boolean
}>

type PropertyConfigContents<T extends Arrayable<FunctionalValue>> = Readonly<{
  type?: string
  defaultValue?: T
  isDenormalized?: boolean
  value?: T
  choices?: readonly VeryPrimitivesTypes[]
  lazyLoadMethod?: <TData extends FunctionalModel>(
    value: T,
    modelData: TData
  ) => MaybeLazy<T>
  valueSelector?: (instanceValue: MaybePromise<T>) => T
  validators?: readonly PropertyValidatorComponent<any>[]
  maxLength?: number
  minLength?: number
  maxValue?: number
  minValue?: number
  autoNow?: boolean
  fetcher?: ModelFetcher
}>

type ModelFetcher = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
>(
  model: TModel,
  primaryKey: PrimaryKeyType
) =>
  | Promise<T | TModelInstance | TypedJsonObj<T>>
  | Promise<null>
  | Promise<undefined>

type PropertyConfig<T extends Arrayable<FunctionalValue>> =
  | (PropertyConfigContents<T> & DefaultPropertyValidators)
  | undefined

type PrimaryKeyPropertyInstanceType =
  | PropertyInstance<string>
  | PropertyInstance<number>

type PrimaryKeyType = string | number

type ModelDefinition<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
> = Readonly<{
  getPrimaryKeyName?: () => string
  properties: {
    id?: PrimaryKeyPropertyInstanceType
  } & PropertiesList<T>
  modelValidators?: readonly ModelValidatorComponent<T, TModel>[]
  singularName?: string
  displayName?: string
}>

type ModelFactory = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
>(
  pluralName: string,
  modelDefinition: ModelDefinition<T, TModel>,
  options?: OptionalModelOptions<T, TModel, TModelInstance>
) => TModel

type CreateParams<T extends FunctionalModel> =
  | T
  | TypedJsonObj<T>
  | (TypedJsonObj<T> & Readonly<{ id?: PrimaryKeyType }>)

type Model<T extends FunctionalModel> = Readonly<{
  getName: () => string
  getSingularName: () => string
  getDisplayName: () => string
  getPrimaryKeyName: () => string
  getModelDefinition: () => ModelDefinition<T>
  getPrimaryKey: (t: T | TypedJsonObj<T>) => PrimaryKeyType
  getOptions: () => object & ModelOptions<T>
  create: (data: CreateParams<T>) => ModelInstance<T>
}>

type ModelReferenceFunctions = Readonly<{
  [s: string]: () => Maybe<PrimaryKeyType>
}>

type PropertyValidators<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
> = Readonly<{
  id?: PropertyValidator<T, TModel>
}> &
  Readonly<{
    [s: string]: PropertyValidator<T, TModel>
  }>

type ModelInstance<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
> = Readonly<{
  get: PropertyGetters<T> & {
    id?: () => MaybePromise<PrimaryKeyType>
  }
  references: ModelReferenceFunctions
  toObj: toObj<T>
  getPrimaryKeyName: () => string
  getPrimaryKey: () => PrimaryKeyType
  validators: PropertyValidators<T, TModel>
  validate: (options?: object) => Promise<ModelErrors<T>>
  getModel: () => TModel
}>

type ValueRequired<T extends Arrayable<FunctionalValue>> = NonNullable<T>
type ValueOptional<T extends Arrayable<FunctionalValue>> = Maybe<T>
type ValueRequiredR<T extends FunctionalModel> = ValueRequired<
  ModelReference<T>
>
type ValueOptionalR<T extends FunctionalModel> = ValueOptional<
  ModelReference<T>
>

type IsAsync<T extends Arrayable<FunctionalValue>> = Promise<T>

type PropertyModifier<T extends Arrayable<FunctionalValue>> =
  | ValueRequired<T>
  | ValueOptional<T>
  | T

type ModelOptions<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> = Readonly<{
  instanceCreatedCallback: Nullable<
    Arrayable<(instance: TModelInstance) => void>
  >
  [s: string]: any
}>

type OptionalModelOptions<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
> =
  | Readonly<{
      instanceCreatedCallback?: Nullable<
        Arrayable<(instance: TModelInstance) => void>
      >
      [s: string]: any
    }>
  | undefined

type CalculateDenormalization<
  T extends FunctionalValue,
  TModel extends FunctionalModel,
> = (modelData: TModel) => MaybePromise<T>

export {
  MaybeFunction,
  Maybe,
  MaybePromise,
  Nullable,
  Arrayable,
  MaybeLazy,
  JsonAble,
  toObj,
  ModelInstance,
  Model,
  PropertyValidatorComponent,
  PropertyValidatorComponentSync,
  PropertyValidatorComponentAsync,
  PropertyValidator,
  ModelValidatorComponent,
  PropertyInstance,
  PropertyConfig,
  FunctionalValue,
  ValueGetter,
  ModelReference,
  ModelDefinition,
  ModelOptions,
  OptionalModelOptions,
  ModelReferencePropertyInstance,
  PropertyGetters,
  PropertyValidators,
  PropertyValidatorComponentTypeAdvanced,
  FunctionalModel,
  ModelReferenceFunctions,
  ModelErrors,
  PrimaryKeyType,
  ModelFactory,
  ModelFetcher,
  CreateParams,
  ValidatorConfiguration,
  ValuePropertyValidatorComponent,
  ValueRequired,
  ValueOptional,
  PropertyModifier,
  ValidationErrors,
  ModelError,
  IsAsync,
  TypedJsonObj,
  JsonObj,
  ValueRequiredR,
  ValueOptionalR,
  CalculateDenormalization,
}
/* eslint-enable no-unused-vars */
