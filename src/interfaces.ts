/* eslint-disable no-unused-vars */
type MaybeFunction<T> = T | (() => T)
type MaybePromise<T> = T | Promise<T>
type Nullable<T> = T | null
type Maybe<T> = T | undefined | null
type Arrayable<T> = T | readonly T[]
type MaybeLazy<T> = Maybe<Promise<T>>
type UnWrapPromises<T> = {
  readonly [P in keyof T]: Awaited<T[P]>
}
type JsonObj = {
  readonly [s: string]: JsonAble | null
}
type NoFunctions<T> = RemoveType<T, (...args: readonly any[]) => any>

type TypedJsonObj<T extends FunctionalModel> = {
  readonly [P in keyof NoFunctions<UnWrapPromises<T>>]: JsonAble
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

type ValueIsOfType<T, V> = {
  readonly [P in keyof T as T[P] extends V ? P : never]: T[P]
}

type ModelMethod<
  T extends FunctionalModel = FunctionalModel,
  TModel extends Model<T> = Model<T>
> = (model: TModel, ...args: readonly any[]) => any
type ModelMethodClient = (...args: readonly any[]) => any
type ModelMethods<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = ValueIsOfType<T, ModelMethod | ModelMethod<T> | ModelMethod<T, TModel>>

type ModelMethodGetters<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = {
  readonly [P in keyof T as T[P] extends
    | ModelMethod<T, TModel>
    | ModelMethod<T>
    | ModelMethod
    ? P
    : never]: ModelMethodClient
}

type ModelInstanceMethod<
  T extends FunctionalModel = FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = (instance: TModelInstance, model: TModel, ...args: readonly any[]) => any
type ModelInstanceMethodClient = (...args: readonly any[]) => any

type RemoveType<T, TRemove> = {
  readonly [P in keyof T as T[P] extends TRemove ? never : P]: T[P]
}
type NotModelMethods<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = RemoveType<T, ModelMethod | ModelMethod<T> | ModelMethod<T, TModel>>

type InstanceMethodGetters<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = {
  readonly // What this is doing is removing all of the ModelMethods FIRST, before selecting the ModelInstanceMethods. Normally ModelMethods get picked up by this.
  [P in keyof NotModelMethods<T, TModel> as NotModelMethods<
    T,
    TModel
  >[P] extends
    | ModelInstanceMethod
    | ModelInstanceMethod<T, TModel>
    | ModelInstanceMethod<T, TModel, TModelInstance>
    | ModelInstanceMethod<T, TModel, any>
    ? P
    : never]: ModelInstanceMethodClient
}

type ModelMethodTypes<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> =
  | ModelMethod
  | ModelMethod<T>
  | ModelMethod<T, TModel>
  | ModelInstanceMethod
  | ModelInstanceMethod<T>
  | ModelInstanceMethod<T, TModel>
  | ModelInstanceMethod<T, TModel, any>

type InstanceMethods<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = ValueIsOfType<
  T,
  | ModelInstanceMethod
  | ModelInstanceMethod<T>
  | ModelInstanceMethod<T, TModel>
  | ModelInstanceMethod<T, TModel, TModelInstance>
>

type PropertyGetters<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = {
  readonly // NOTE: This is NOT ModelMethodTypes, its getting everything but.
  [Property in keyof T as T[Property] extends ModelMethodTypes<T, TModel>
    ? never
    : Property]: () => T[Property]
}

type FunctionalModel =
  | {
      readonly [s: string]:
        | Arrayable<number>
        | Promise<number>
        | Arrayable<string>
        | Arrayable<boolean>
        | Arrayable<null>
        | Arrayable<FunctionalModel>
        | Arrayable<Date>
        | Arrayable<undefined>
        | ReferenceValueType<any>
        | ModelInstanceMethod
        | ModelMethod
    } & { readonly id?: PrimaryKeyType }

type FunctionalValue = MaybePromise<
  | JsonAble
  | (() => FunctionalValue)
  | Arrayable<null>
  | Arrayable<undefined>
  | Arrayable<Date>
  | Arrayable<FunctionalModel>
  | Arrayable<{ readonly [s: string]: JsonAble }>
>

type ModelInstanceInputData<T extends FunctionalModel> =
  | RemoveType<T, (...args: readonly any[]) => any>
  | UnWrapPromises<T>
  | TypedJsonObj<T>

type ValidatorConfiguration = {
  readonly [s: string]: any
}

type ValidationErrorResponse = string | undefined
type ValidationErrors = readonly string[]
type ModelError = string | undefined
type ModelErrors<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = {
  readonly // NOTE: This is NOT ModelMethodTypes, its getting everything but.
  [Property in keyof T as T[Property] extends ModelMethodTypes<T, TModel>
    ? never
    : Property]: readonly string[] | undefined
} & { readonly overall?: readonly string[] | undefined }

type PropertyValidatorComponentTypeAdvanced<
  TValue,
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = (
  value: TValue,
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => ValidationErrorResponse

type PropertyValidatorComponentSync<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = PropertyValidatorComponentTypeAdvanced<any, T, TModel, TModelInstance>

type ValuePropertyValidatorComponent<T extends Arrayable<FunctionalValue>> = (
  value: T
) => ValidationErrorResponse

type PropertyValidatorComponentAsync<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = (
  value: Arrayable<FunctionalValue>,
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrorResponse>

type PropertyValidatorComponent<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> =
  | PropertyValidatorComponentSync<T, TModel, TModelInstance>
  | PropertyValidatorComponentAsync<T, TModel, TModelInstance>

type PropertyValidator<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = (
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrors>

type ModelValidatorComponent<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = (
  instance: TModelInstance,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ModelError>

type ValueGetter<T extends Arrayable<FunctionalValue>> = () => MaybePromise<
  T | ModelInstance<any, any>
>

type PropertyInstance<TValue extends Arrayable<FunctionalValue>> = {
  readonly getConfig: () => object
  readonly getChoices: () => readonly VeryPrimitivesTypes[]
  readonly getDefaultValue: () => TValue
  readonly getConstantValue: () => TValue
  readonly getPropertyType: () => string
  readonly createGetter: (value: TValue) => ValueGetter<TValue>
  readonly getValidator: <TModel extends FunctionalModel>(
    valueGetter: ValueGetter<TValue>
  ) => PropertyValidator<TModel>
}

type PropertiesList<T extends FunctionalModel> = {
  readonly [P in keyof T as T[P] extends Arrayable<FunctionalValue>
    ? P
    : never]: PropertyInstance<any>
}

interface ReferencePropertyInstance<
  T extends FunctionalModel,
  TProperty extends Arrayable<FunctionalValue>
> extends PropertyInstance<TProperty> {
  readonly getReferencedId: (
    instanceValues: ReferenceValueType<T>
  ) => Maybe<PrimaryKeyType>
  readonly getReferencedModel: () => Model<T>
}

type ReferenceValueType<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = TModelInstance | ModelInstanceInputData<T> | PrimaryKeyType

type DefaultPropertyValidators = {
  readonly required?: boolean
  readonly isInteger?: boolean
  readonly isNumber?: boolean
  readonly isString?: boolean
  readonly isArray?: boolean
  readonly isBoolean?: boolean
}

type PropertyConfigContents<T extends Arrayable<FunctionalValue>> = {
  readonly type?: string
  readonly defaultValue?: T
  readonly value?: T
  readonly choices?: readonly VeryPrimitivesTypes[]
  readonly lazyLoadMethod?: (value: T) => MaybeLazy<T>
  readonly valueSelector?: (instanceValue: MaybePromise<T>) => T
  readonly validators?: readonly PropertyValidatorComponent<any>[]
  readonly maxLength?: number
  readonly minLength?: number
  readonly maxValue?: number
  readonly minValue?: number
  readonly autoNow?: boolean
  readonly fetcher?: ModelFetcher
}

type ModelFetcher = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
>(
  model: TModel,
  primaryKey: PrimaryKeyType
) =>
  | Promise<ModelInstance<T, TModel>>
  | Promise<ModelInstanceInputData<T>>
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
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = {
  readonly getPrimaryKeyName?: () => string
  readonly properties: PropertiesList<T> & {
    readonly id?: PrimaryKeyPropertyInstanceType
  }
  readonly modelMethods?: ModelMethods<T, TModel>
  readonly instanceMethods?: InstanceMethods<T, TModel, TModelInstance>
  readonly modelValidators?: readonly ModelValidatorComponent<T, TModel>[]
}

type ModelFactory = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
>(
  modelName: string,
  modelDefinition: ModelDefinition<T, TModel, TModelInstance>,
  options?: OptionalModelOptions<T, TModel, TModelInstance>
) => TModel

type CreateParams<T extends FunctionalModel> =
  | ModelInstanceInputData<T>
  | (ModelInstanceInputData<T> & { readonly id?: PrimaryKeyType })

type Model<T extends FunctionalModel> = {
  readonly getName: () => string
  readonly getPrimaryKeyName: () => string
  readonly getModelDefinition: () => ModelDefinition<T>
  readonly getPrimaryKey: (t: ModelInstanceInputData<T>) => PrimaryKeyType
  readonly getOptions: () => object & ModelOptions<T>
  readonly create: (data: CreateParams<T>) => ModelInstance<T>
  readonly methods: ModelMethodGetters<T>
}

type ReferenceFunctions = {
  readonly [s: string]: () => ReferenceValueType<any>
}

type PropertyValidators<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = {
  readonly [s: string]: PropertyValidator<T, TModel>
}

type ModelInstance<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = {
  readonly get: PropertyGetters<T, TModel> & {
    readonly id: () => MaybePromise<PrimaryKeyType>
  }
  readonly methods: InstanceMethodGetters<T, TModel>
  readonly references: ReferenceFunctions
  readonly toObj: toObj<T>
  readonly getPrimaryKeyName: () => string
  readonly getPrimaryKey: () => PrimaryKeyType
  readonly validators: PropertyValidators<T, TModel>
  readonly validate: (options?: {}) => Promise<ModelErrors<T, TModel>>
  readonly getModel: () => TModel
}

type ValueRequired<T extends Arrayable<FunctionalValue>> = NonNullable<T>
type ValueOptional<T extends Arrayable<FunctionalValue>> = Maybe<T>
type ValueOptionalR<T extends FunctionalModel> = ValueOptional<
  ReferenceValueType<T>
>
type ValueRequiredR<T extends FunctionalModel> = ValueRequired<
  ReferenceValueType<T>
>

type IsAsync<T extends Arrayable<FunctionalValue>> = Promise<T>

type PropertyModifier<T extends Arrayable<FunctionalValue>> =
  | ValueRequired<T>
  | ValueOptional<T>
  | T

type ModelOptions<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> = {
  readonly instanceCreatedCallback: Nullable<
    Arrayable<(instance: TModelInstance) => void>
  >
  readonly [s: string]: any
}

type OptionalModelOptions<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>
> =
  | {
      readonly instanceCreatedCallback?: Nullable<
        Arrayable<(instance: TModelInstance) => void>
      >
      readonly [s: string]: any
    }
  | undefined

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
  ReferenceValueType,
  ModelDefinition,
  ModelOptions,
  ModelMethod,
  OptionalModelOptions,
  ReferencePropertyInstance,
  PropertyGetters,
  PropertyValidators,
  PropertyValidatorComponentTypeAdvanced,
  ModelInstanceMethod,
  FunctionalModel,
  ModelInstanceInputData,
  ModelMethodGetters,
  InstanceMethodGetters,
  ReferenceFunctions,
  ModelErrors,
  PrimaryKeyType,
  ModelFactory,
  ModelFetcher,
  CreateParams,
  ValidatorConfiguration,
  ValuePropertyValidatorComponent,
  ValueRequired,
  ValueOptional,
  ValueOptionalR,
  ValueRequiredR,
  PropertyModifier,
  ValidationErrors,
  ModelError,
  IsAsync,
  ModelInstanceMethodClient,
  ModelMethodClient,
  TypedJsonObj,
}
/* eslint-enable no-unused-vars */
