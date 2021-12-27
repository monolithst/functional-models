/* eslint-disable no-unused-vars */
type MaybeFunction<T> = T | (() => T)
type MaybePromise<T> = T | Promise<T>
type Nullable<T> = T | null
type Maybe<T> = T | undefined | null
type Arrayable<T> = T | readonly T[]
type MaybeLazy<T> = Maybe<Promise<T>>
type JsonAble =
  | Arrayable<{ readonly [s: string]: JsonAble|null }>
  | readonly (number|string|boolean)[]
  | number
  | string
  | boolean
type VeryPrimitivesTypes = null | string | number | boolean
type toObj = () => Promise<JsonAble>

type ValueIsOfType<T, V> = {
  readonly [P in keyof T as T[P] extends V ? P : never]: T[P]
}

type MethodArgs = {
  [s: string]: any
}

type ModelMethodTypedAdvanced<T extends FunctionalModel, TModel extends Model<T>> = (
  model: TModel,
  args?: MethodArgs,
) => any
type ModelMethodTyped<T extends FunctionalModel> = ModelMethodTypedAdvanced<T, Model<T>>
type ModelMethod = ModelMethodTyped<any>
type ModelMethodClient = (args?: MethodArgs) => any

type ModelInstanceMethodTypedAdvanced<T extends FunctionalModel, TModel extends Model<T>, TModelInstance extends ModelInstance<T>> = (
  model: TModel,
  instance: TModelInstance,
  args?: MethodArgs,
) => any
type ModelInstanceMethodTyped<T extends FunctionalModel> = ModelInstanceMethodTypedAdvanced<T, Model<T>, ModelInstance<T>>
type ModelInstanceMethod = ModelInstanceMethodTyped<FunctionalModel>
type ModelInstanceMethodClient = (args?: MethodArgs) => any

type InstanceMethodGetters<T extends FunctionalModel> = {
  readonly [P in keyof T as T[P] extends ModelInstanceMethod | ModelInstanceMethodTyped<T> | ModelInstanceMethodTypedAdvanced<T, any, any>
    ? P
    : never]: ModelInstanceMethodClient
}

type ModelMethodGetters<T extends FunctionalModel> = {
  readonly [P in keyof T as T[P] extends ModelMethod | ModelMethodTyped<T> | ModelMethodTypedAdvanced<T, any>
    ? P
    : never]: ModelMethodClient
}

type ModelMethodTypes<T extends FunctionalModel> =
  | ModelMethod
  | ModelMethodTyped<T>
  | ModelMethodTypedAdvanced<T, any>
  | ModelInstanceMethod
  | ModelInstanceMethodTyped<T>
  | ModelInstanceMethodTypedAdvanced<T, any, any>

type PropertyGetters<T extends FunctionalModel> = {
  readonly // NOTE: This is NOT ModelMethodTypes, its getting everything but.
  [Property in keyof T as T[Property] extends ModelMethodTypes<T>
    ? never
    : Property]: () => T[Property]
}

type FunctionalModel =
  | ({
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
    } & {readonly id?: Promise<PrimaryKeyType>})

type FunctionalValue =MaybePromise<
  | JsonAble
  | (() => FunctionalValue)
  | Arrayable<null>
  | Arrayable<undefined>
  | Arrayable<Date>
  | Arrayable<FunctionalModel>
  | Arrayable<{ readonly [s: string]: JsonAble }>
  >

type ModelInstanceInputData<T extends FunctionalModel> =
  | {
      readonly
      [P in keyof T as T[P] extends ModelMethodTypes<T> ? never : P]: T[P]
    }
  | JsonAble

type ValidatorConfiguration = {
  readonly [s: string]: any
}

type ValidationErrorResponse = string | undefined
type ValidationErrors = readonly string[]
type ModelError = string|undefined
type ModelErrors<T extends FunctionalModel> = {
  readonly // NOTE: This is NOT ModelMethodTypes, its getting everything but.
  [Property in keyof T as T[Property] extends ModelMethodTypes<T>
    ? never
    : Property]: readonly string[]|undefined
} & { readonly overall?: readonly string[]|undefined}

type PropertyValidatorComponentTypeAdvanced<
  TValue,
  TModel extends FunctionalModel
> = (
  value: TValue,
  instance: ModelInstance<TModel>,
  instanceData: TModel | JsonAble,
  configurations: ValidatorConfiguration
) => ValidationErrorResponse

type PropertyValidatorComponentType<TValue> = (
  value: TValue,
  instance: ModelInstance<any>,
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
  instance: ModelInstance<T>,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrorResponse>

type PropertyValidatorComponent<T extends FunctionalModel> =
  | PropertyValidatorComponentSync<T>
  | PropertyValidatorComponentAsync<T>

type PropertyValidator<T extends FunctionalModel> = (
  instance: ModelInstance<T>,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ValidationErrors>

type ModelValidatorComponent<T extends FunctionalModel> = (
  instance: ModelInstance<T>,
  instanceData: T | JsonAble,
  configurations: ValidatorConfiguration
) => Promise<ModelError>

type ValueGetter<T extends Arrayable<FunctionalValue>> = () => MaybePromise<
  T | ModelInstance<any>
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

type ReferenceValueType<T extends FunctionalModel> = ModelInstance<T> | ModelInstanceInputData<T> | PrimaryKeyType


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
  ModelInstance<any> | ModelInstanceInputData<any> | null | undefined
>

type PropertyConfig<T extends Arrayable<FunctionalValue>> =
  | (PropertyConfigContents<T> & DefaultPropertyValidators)
  | undefined

type ModelMethods<T extends FunctionalModel> = ValueIsOfType<
  T,
  ModelMethod | ModelMethodTyped<T> | ModelMethodTypedAdvanced<T, any>
  >
type InstanceMethods<T extends FunctionalModel> = ValueIsOfType<
  T,
  ModelInstanceMethod | ModelInstanceMethodTyped<T> | ModelInstanceMethodTypedAdvanced<T, any, any>
  >

type PrimaryKeyPropertyInstanceType =
  | PropertyInstance<string>
  | PropertyInstance<number>

type PrimaryKeyType = string | number

type ModelDefinition<T extends FunctionalModel> = {
  readonly getPrimaryKeyName?: () => string
  readonly properties: PropertiesList<T> & {
    readonly id?: PrimaryKeyPropertyInstanceType
  }
  readonly modelMethods?: ModelMethods<T>
  readonly instanceMethods?: InstanceMethods<T>
  readonly modelValidators?: readonly ModelValidatorComponent<T>[]
}

type ModelFactory = <T extends FunctionalModel>(
  modelName: string,
  modelDefinition: ModelDefinition<T>,
  options?: OptionalModelOptions<T>
) => Model<T>

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

type PropertyValidators<T extends FunctionalModel> = {
  readonly [s: string]: PropertyValidator<T>
}

type ModelInstance<T extends FunctionalModel> = {
  readonly get: PropertyGetters<T> & {
    readonly id: () => MaybePromise<PrimaryKeyType>
  }
  readonly methods: InstanceMethodGetters<T>
  readonly references: ReferenceFunctions
  readonly toObj: toObj
  readonly getPrimaryKeyName: () => string
  readonly getPrimaryKey: () => PrimaryKeyType
  readonly validators: PropertyValidators<T>
  readonly validate: (options?: {}) => Promise<ModelErrors<T>>
  readonly getModel: () => Model<T>
}

type ValueRequired<T extends Arrayable<FunctionalValue>> =
  NonNullable<T>
type ValueOptional<T extends Arrayable<FunctionalValue>> =
  Maybe<T>
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


type ModelOptions<T extends FunctionalModel> = {
  readonly instanceCreatedCallback: Nullable<
    Arrayable<(instance: ModelInstance<T>) => void>
  >
  readonly [s: string]: any
}

type OptionalModelOptions<T extends FunctionalModel> =
  | {
      readonly instanceCreatedCallback?: Nullable<
        Arrayable<(instance: ModelInstance<T>) => void>
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
  ModelInstanceMethodTyped,
  FunctionalModel,
  ModelInstanceInputData,
  ModelMethodTyped,
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
  MethodArgs,
}
/* eslint-enable no-unused-vars */
