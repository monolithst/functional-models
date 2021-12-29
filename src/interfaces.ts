/* eslint-disable no-unused-vars */
type MaybeFunction<T> = T | (() => T)
type MaybePromise<T> = T | Promise<T>
type Nullable<T> = T | null
type Maybe<T> = T | undefined | null
type Arrayable<T> = T | readonly T[]
type MaybeLazy<T> = Maybe<Promise<T>>
type JsonAble =
  | Arrayable<{ readonly [s: string]: JsonAble | null }>
  | readonly (number | string | boolean)[]
  | number
  | string
  | boolean
type VeryPrimitivesTypes = null | string | number | boolean
type toObj = () => Promise<JsonAble>

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
    | ModelMethod
    | ModelMethod<T>
    | ModelMethod<T, TModel>
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
  TModel extends Model<T> = Model<T>
> = {
  readonly // What this is doing is removing all of the ModelMethods FIRST, before selecting the ModelInstanceMethods. Normally ModelMethods get picked up by this.
  [P in keyof NotModelMethods<T, TModel> as NotModelMethods<
    T,
    TModel
  >[P] extends
    | ModelInstanceMethod
    | ModelInstanceMethod<T, TModel>
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
  | ModelInstanceMethod
  | ModelInstanceMethod<T>
  | ModelInstanceMethod<T, TModel>
  | ModelInstanceMethod<T, TModel, any>

type InstanceMethods<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = ValueIsOfType<
  T,
  ModelInstanceMethod | ModelInstanceMethod<T> | ModelInstanceMethod<T, TModel>
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

type ModelInstanceInputData<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> =
  | {
      readonly [P in keyof T as T[P] extends ModelMethodTypes<T, TModel>
        ? never
        : P]: T[P]
    }
  | JsonAble

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
  TModel extends FunctionalModel
> = (
  value: TValue,
  instance: ModelInstance<TModel, any>,
  instanceData: TModel | JsonAble,
  configurations: ValidatorConfiguration
) => ValidationErrorResponse

type PropertyValidatorComponentType<TValue> = (
  value: TValue,
  instance: ModelInstance<any, any>,
  instanceData: FunctionalModel | JsonAble,
  configurations: ValidatorConfiguration
) => ValidationErrorResponse

type PropertyValidatorComponentSync<T extends FunctionalModel> =
  PropertyValidatorComponentTypeAdvanced<any, T>
type ValuePropertyValidatorComponent<T extends Arrayable<FunctionalValue>> = (
  value: T
) => ValidationErrorResponse

type PropertyValidatorComponentAsync<T extends FunctionalModel> = (
  value: Arrayable<FunctionalValue>,
  instance: ModelInstance<T, any>,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrorResponse>

type PropertyValidatorComponent<T extends FunctionalModel> =
  | PropertyValidatorComponentSync<T>
  | PropertyValidatorComponentAsync<T>

type PropertyValidator<T extends FunctionalModel> = (
  instance: ModelInstance<T, any>,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrors>

type ModelValidatorComponent<T extends FunctionalModel> = (
  instance: ModelInstance<T, any>,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ModelError>

type ValueGetter<T extends Arrayable<FunctionalValue>> = () => MaybePromise<
  T | ModelInstance<any, any>
>

type PropertyInstance<T extends Arrayable<FunctionalValue>> = {
  readonly getConfig: () => object
  readonly getChoices: () => readonly VeryPrimitivesTypes[]
  readonly getDefaultValue: () => T
  readonly getConstantValue: () => T
  readonly getPropertyType: () => string
  readonly createGetter: (value: T) => ValueGetter<T>
  readonly getValidator: <TModel extends FunctionalModel>(
    valueGetter: ValueGetter<T>
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

type ReferenceValueType<T extends FunctionalModel> =
  | ModelInstance<T, any>
  | ModelInstanceInputData<T, any>
  | PrimaryKeyType

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

type ModelFetcher = (
  model: Model<any>,
  primaryKey: PrimaryKeyType
) => Promise<
  ModelInstance<any, any> | ModelInstanceInputData<any, any> | null | undefined
>

type PropertyConfig<T extends Arrayable<FunctionalValue>> =
  | (PropertyConfigContents<T> & DefaultPropertyValidators)
  | undefined

type PrimaryKeyPropertyInstanceType =
  | PropertyInstance<string>
  | PropertyInstance<number>

type PrimaryKeyType = string | number

type ModelDefinition<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = {
  readonly getPrimaryKeyName?: () => string
  readonly properties: PropertiesList<T> & {
    readonly id?: PrimaryKeyPropertyInstanceType
  }
  readonly modelMethods?: ModelMethods<T, TModel>
  readonly instanceMethods?: InstanceMethods<T, TModel>
  readonly modelValidators?: readonly ModelValidatorComponent<T>[]
}

type ModelFactory = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
>(
  modelName: string,
  modelDefinition: ModelDefinition<T, TModel>,
  options?: OptionalModelOptions<T>
) => Model<T>

type CreateParams<T extends FunctionalModel, TModel extends Model<T>> =
  | ModelInstanceInputData<T, TModel>
  | (ModelInstanceInputData<T, TModel> & { readonly id?: PrimaryKeyType })

type Model<T extends FunctionalModel> = {
  readonly getName: () => string
  readonly getPrimaryKeyName: () => string
  readonly getModelDefinition: () => ModelDefinition<T>
  readonly getPrimaryKey: (t: ModelInstanceInputData<T>) => PrimaryKeyType
  readonly getOptions: () => object & ModelOptions<T>
  readonly create: (data: CreateParams<T, any>) => ModelInstance<T, Model<T>>
  readonly methods: ModelMethodGetters<T>
}

type ReferenceFunctions = {
  readonly [s: string]: () => ReferenceValueType<any>
}

type PropertyValidators<T extends FunctionalModel> = {
  readonly [s: string]: PropertyValidator<T>
}

type ModelInstance<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> = {
  readonly get: PropertyGetters<T> & {
    readonly id: () => MaybePromise<PrimaryKeyType>
  }
  readonly methods: InstanceMethodGetters<T, TModel>
  readonly references: ReferenceFunctions
  readonly toObj: toObj
  readonly getPrimaryKeyName: () => string
  readonly getPrimaryKey: () => PrimaryKeyType
  readonly validators: PropertyValidators<T>
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
  TModel extends Model<T> = Model<T>
> = {
  readonly instanceCreatedCallback: Nullable<
    Arrayable<(instance: ModelInstance<T, TModel>) => void>
  >
  readonly [s: string]: any
}

type OptionalModelOptions<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
> =
  | {
      readonly instanceCreatedCallback?: Nullable<
        Arrayable<(instance: ModelInstance<T, TModel>) => void>
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
  PropertyValidatorComponentType,
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
}
/* eslint-enable no-unused-vars */
