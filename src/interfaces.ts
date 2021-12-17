/* eslint-disable no-unused-vars */
type MaybeFunction<T> = T | (() => T)
type MaybePromise<T> = T | Promise<T>
type Nullable<T> = T | null
type Maybe<T> = T | undefined | null
type Arrayable<T> = T | readonly T[]
type MaybeLazy<T> = Maybe<Promise<T>>
type JsonAble =
  | Arrayable<{ readonly [s: string]: JsonAble }>
  | Arrayable<number>
  | Arrayable<string>
  | Arrayable<boolean>
  | Arrayable<null>
type VeryPrimitivesTypes = null | string | number | boolean
type toObj = () => Promise<JsonAble>

type ValueIsOfType<T, V> = {
  readonly [P in keyof T as T[P] extends V ? P : never]: T[P]
}

type ValueIsNotOfType<T, V> = {
  readonly [P in keyof T as T[P] extends V ? never : P]: T[P]
}

type InstanceMethodGetters<T> = {
  readonly [P in keyof T as T[P] extends ModelInstanceMethod
    ? P
    : never]: ModelInstanceMethodClient
}

type ModelMethodGetters<T> = {
  readonly [P in keyof T as T[P] extends ModelMethod
    ? P
    : never]: ModelMethodClient
}

type ModelMethodTypes<T extends FunctionalModel> =
  | ModelMethod
  | ModelInstanceMethod
  | ModelMethodTyped<T>
  | ModelInstanceMethodTyped<T>

type PropertyGetters<T extends FunctionalModel> = {
  readonly // NOTE: This is NOT ModelMethodTypes, its getting everything but.
  [Property in keyof T as T[Property] extends ModelMethodTypes<T>
    ? never
    : Property]: () => T[Property] | Promise<T[Property]>
}

type FunctionalModel =
  | JsonAble
  | {
      readonly [s: string]:
        | Arrayable<number>
        | Arrayable<string>
        | Arrayable<boolean>
        | Arrayable<null>
        | Arrayable<FunctionalModel>
        | Arrayable<Date>
        | Arrayable<undefined>
        | ReferenceValueType<any>
        | ModelInstanceMethod
        | ModelMethod
    }

type FunctionalType =
  | JsonAble
  | (() => FunctionalType)
  | Arrayable<undefined>
  | Arrayable<Date>
  | Arrayable<FunctionalModel>
  | Arrayable<{ readonly [s: string]: JsonAble }>

type ModelInstanceInputData<T extends FunctionalModel> = {
  //readonly [P in keyof T as T[P] extends ModelMethodTypes<T> ? never : P]: T[P]
  //readonly [s: string]: any
  readonly [P in keyof T as T[P] extends ModelMethodTypes<T> ? never : P]: T[P]
}

type PropertyValidatorComponentTypeAdvanced<
  TValue,
  TModel extends FunctionalModel
> = (
  value: TValue,
  instance: ModelInstance<TModel>,
  instanceData: FunctionalModel
) => string | undefined

type PropertyValidatorComponentType<TValue> = (
  value: TValue,
  instance: ModelInstance<any>,
  instanceData: FunctionalModel
) => string | undefined

type PropertyValidatorComponentSync = PropertyValidatorComponentType<any>

type PropertyValidatorComponentAsync = (
  value: Arrayable<FunctionalModel>,
  instance: ModelInstance<any>,
  instanceData: FunctionalModel
) => Promise<string | undefined>

type PropertyValidatorComponent =
  | PropertyValidatorComponentSync
  | PropertyValidatorComponentAsync

type PropertyValidator = (
  instance: ModelInstance<any>,
  instanceData: FunctionalModel
) => Promise<ValidationErrors>

type ValidationError = string | undefined
type ValidationErrors = readonly ValidationError[]
type ModelError = string
type ModelErrors = {
  readonly [s: string]: readonly ModelError[]
}

type ModelComponentValidator = (
  instance: ModelInstance<any>,
  instanceData: FunctionalModel,
  options?: object
) => Promise<ValidationErrors>

type ValueGetter = () =>
  | MaybePromise<Arrayable<FunctionalType>>
  | MaybePromise<ModelInstance<any>>

type PropertyInstance<T extends Arrayable<FunctionalType>> = {
  readonly getConfig: () => object
  readonly getChoices: () => readonly VeryPrimitivesTypes[]
  readonly getDefaultValue: () => T
  readonly getConstantValue: () => T
  readonly getPropertyType: () => string
  readonly createGetter: (value: T) => ValueGetter
  readonly getValidator: (valueGetter: ValueGetter) => PropertyValidator
}

type PropertiesList<T> = {
  readonly [P in keyof T as T[P] extends Arrayable<FunctionalType>
    ? P
    : never]: PropertyInstance<any>
}

interface ReferencePropertyInstance<T extends FunctionalModel>
  extends PropertyInstance<ModelInstance<T> | T | Maybe<PrimaryKeyType>> {
  readonly getReferencedId: (
    instanceValues: ReferenceValueType<T>
  ) => Maybe<PrimaryKeyType>
  readonly getReferencedModel: () => Model<T>
}

type ReferenceValueType<T extends FunctionalModel> =
  | Maybe<
    | ModelInstance<T>
    | ModelInstanceInputData<T>
    | PrimaryKeyType
  >

type DefaultPropertyValidators = {
  readonly required?: boolean
  readonly isInteger?: boolean
  readonly isNumber?: boolean
  readonly isString?: boolean
  readonly isArray?: boolean
  readonly isBoolean?: boolean
}

type PropertyConfigContents<T extends Arrayable<FunctionalType>> = {
  readonly type?: string
  readonly defaultValue?: T
  readonly value?: T
  readonly choices?: readonly VeryPrimitivesTypes[]
  readonly lazyLoadMethod?: (
    value: T
  ) => MaybeLazy<T>
  readonly valueSelector?: (
    instanceValue: MaybePromise<T>
  ) => T
  readonly validators?: readonly PropertyValidatorComponent[]
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
) => Promise<ModelInstance<any> | ModelInstanceInputData<any> | null | undefined>

type PropertyConfig<T extends Arrayable<FunctionalType>> =
  | (PropertyConfigContents<T> & DefaultPropertyValidators)
  | undefined

type PrimaryKeyPropertyInstanceType =
  | PropertyInstance<string>
  | PropertyInstance<number>
type PrimaryKeyType = string | number

type ModelMethods<T extends FunctionalModel> = ValueIsOfType<
  T,
  ModelMethod | ModelMethodTyped<T>
>
type InstanceMethods<T extends FunctionalModel> = ValueIsOfType<
  T,
  ModelInstanceMethod | ModelInstanceMethodTyped<T>
>
type ModelDefinition<T extends FunctionalModel> = {
  readonly getPrimaryKeyName?: () => string
  readonly properties: PropertiesList<T> & {
    readonly id?: PrimaryKeyPropertyInstanceType
  }
  readonly instanceMethods?: InstanceMethods<T>
  readonly modelMethods?: ModelMethods<T>
  readonly modelValidators?: readonly ModelComponentValidator[]
}

type ModelFactory = <T extends FunctionalModel>(
  modelName: string,
  modelDefinition: ModelDefinition<T>,
  options?: OptionalModelOptions<T>
) => Model<T>

type CreateParams<T extends FunctionalModel> =
  | (ModelInstanceInputData<T> & { readonly id?: PrimaryKeyType })
  | ModelInstanceInputData<T>

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

type PropertyValidators = {
  readonly [s: string]: PropertyValidator
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
  readonly validators: PropertyValidators
  readonly validate: (options?: {}) => Promise<ModelErrors>
  readonly getModel: () => Model<T>
}

type ModelMethodTyped<T extends FunctionalModel> = (
  model: Model<T>,
  args?: readonly any[]
) => any
type ModelMethod = ModelMethodTyped<any>
type ModelMethodClient = (...args: readonly any[]) => any
type ModelInstanceMethodTyped<T extends FunctionalModel> = (
  instance: ModelInstance<T>,
  args?: readonly any[]
) => any
type ModelInstanceMethod = ModelInstanceMethodTyped<any>
type ModelInstanceMethodClient = (...args: readonly any[]) => any

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
  ModelComponentValidator,
  PropertyInstance,
  PropertyConfig,
  FunctionalType,
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
}
/* eslint-enable no-unused-vars */
