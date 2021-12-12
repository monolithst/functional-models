/* eslint-disable no-unused-vars */

type ValueIsOfType<T,V> = {
  readonly [ P in keyof T as T[P] extends V ? P : never ] : T[P]
}

type ValueIsNotOfType<T,V> = {
  readonly [ P in keyof T as T[P] extends V ? never : P ] : T[P]
}

type InterfaceMethodGetters<T> = {
  readonly [ P in keyof T as T[P] extends IModelInstanceMethod ? P : never ] : IModelInstanceMethodClient
}

type ModelMethodGetters<T> = {
  readonly [ P in keyof T as T[P] extends IModelMethod ? P : never ] : IModelMethodClient
}

type ModelMethodTypes = IModelMethod|IModelInstanceMethod

type Getters<T> = {
  readonly [Property in keyof T as T[Property] extends ModelMethodTypes ? never : Property]: () => T[Property]|Promise<T[Property]>
} & readonly [keyof T]

type MaybeFunction<T> = T | (() => T)
type Nullable<T> = T | null
type Maybe<T> = T | undefined | null
type Arrayable<T> = T | readonly T[]
type IMaybeLazy<T> = Maybe<Promise<T>>

type FunctionalModel = {
  readonly [s: string]: Arrayable<number> |
    Arrayable<string> |
    Arrayable<boolean> |
    Arrayable<null> |
    Arrayable<FunctionalObj> |
    Arrayable<Date> |
    ReferenceValueType<any> |
    IModelInstanceMethod |
    IModelMethod |
    undefined,
}

type FunctionalObj = {
  readonly [s: string]: Arrayable<number> |
    Arrayable<string> |
    Arrayable<boolean> |
    Arrayable<null> |
    Arrayable<FunctionalObj> |
    Arrayable<Date> |
    undefined,
}

type FunctionalType = Arrayable<Nullable<number>> | Arrayable<Nullable<string>> | Arrayable<boolean> | Arrayable<null> | Arrayable<undefined> | Arrayable<FunctionalObj> | Arrayable<Date> | Arrayable<FunctionalModel>

interface IPropertyValidatorComponentTypeAdvanced<TValue, TModel extends FunctionalObj|FunctionalModel> {
  (value: TValue, instance: IModelInstance<TModel>, instanceData: TModel): string | undefined
}

interface IPropertyValidatorComponentType<TValue> {
  (value: TValue, instance: IModelInstance<any>, instanceData: FunctionalObj): string | undefined
}

interface IPropertyValidatorComponentSync extends IPropertyValidatorComponentTypeAdvanced<any, any> {
}

interface IPropertyValidatorComponentAsync {
  (value: Arrayable<FunctionalType>, instance: IModelInstance<any>, instanceData: FunctionalObj): Promise<string | undefined>
}

type IPropertyValidatorComponent = IPropertyValidatorComponentSync | IPropertyValidatorComponentAsync

type ValidationError = string|undefined
type ValidationErrors = readonly ValidationError[]


interface IPropertyValidator {
  (instance: IModelInstance<any>, instanceData: FunctionalObj, options?: object): Promise<ValidationErrors>
}

interface IModelErrors {
  readonly [s: string]: readonly string[]
}

interface IModelComponentValidator {
  (instance: IModelInstance<any>, instanceData: FunctionalObj, options?: object): Promise<ValidationErrors>
}

interface IModelValidator {
  (instance: IModelInstance<any>, instanceData: FunctionalObj, options?: object): Promise<IModelErrors>
}

type IValueGetter = () => Arrayable<FunctionalType>|Promise<Arrayable<FunctionalType>>

type IPropertyInstance<T extends Arrayable<FunctionalType>> = {
  readonly getConfig: () => object,
  readonly getChoices: () => readonly string[],
  readonly getDefaultValue: () => T,
  readonly getConstantValue: () => T,
  readonly getPropertyType: () => string,
  readonly createGetter: (value: T) => IValueGetter,
  readonly getValidator: (valueGetter: IValueGetter) => IPropertyValidator,
}
type IPropertyInstanceType = IPropertyInstance<Arrayable<FunctionalType>>
type PropertiesList<T> = {
  readonly [ P in keyof T as T[P] extends Arrayable<FunctionalType> ? P : never ] : IPropertyInstance<any>
}

interface IReferenceProperty<T extends FunctionalModel> extends IPropertyInstance<T|string> {
  readonly getReferencedId: (instanceValues: ReferenceValueType<T>) => string|null|undefined,
  readonly getReferencedModel: () => IModel<T>
}

type ReferenceValueType<T extends FunctionalModel> = IModelInstance<T> | CreateInstanceInput<T> | string | undefined | null

type IDefaultPropertyValidators = {
  readonly required?: boolean,
  readonly isInteger?: boolean,
  readonly isNumber?: boolean,
  readonly isString?: boolean,
  readonly isArray?: boolean,
  readonly isBoolean?: boolean,
}

type IPropertyConfigContents = {
  readonly type?: string,
  readonly defaultValue?: Arrayable<FunctionalType>,
  readonly value?: Arrayable<FunctionalType>,
  readonly choices?: readonly string[],
  readonly lazyLoadMethod?: (value: Arrayable<FunctionalType>) => IMaybeLazy<Arrayable<FunctionalType>>,
  readonly valueSelector?: (instanceValue: Arrayable<FunctionalType>|Promise<Arrayable<FunctionalType>>) => Arrayable<FunctionalType>,
  readonly validators?: readonly IPropertyValidatorComponent[],
  readonly maxLength?: number,
  readonly minLength?: number,
  readonly maxValue?: number,
  readonly minValue?: number,
  readonly autoNow?: boolean,
  readonly fetcher?: (model: IModel<any>, primaryKey: string) => Promise<any>
}

type IPropertyConfig = IPropertyConfigContents & IDefaultPropertyValidators | undefined

type PrimaryKeyPropertyInstanceType = IPropertyInstance<string>|IPropertyInstance<number>
type PrimaryKeyType = string|number

type IModelDefinition<T extends FunctionalModel> = {
  readonly getPrimaryKey?: () => string,
  readonly properties: PropertiesList<T> & { readonly id?: PrimaryKeyPropertyInstanceType },
  readonly instanceMethods?: ValueIsOfType<T, IModelInstanceMethod | IModelInstanceMethodTyped<T>>,
  readonly modelMethods?: ValueIsOfType<T, IModelMethod | IModelMethodTyped<T>>,
  readonly modelValidators?: readonly IModelComponentValidator[]
}

type CreateInstanceInput<T extends FunctionalModel> = ValueIsNotOfType<T, ModelMethodTypes>

type IModel<T extends FunctionalModel> = {
  readonly getName: () => string,
  readonly getPrimaryKeyName: () => string,
  readonly getModelDefinition: () => IModelDefinition<T>,
  readonly getPrimaryKey: (t: CreateInstanceInput<T>) => PrimaryKeyType,
  readonly create: (data: CreateInstanceInput<T>) => IModelInstance<T>,
  readonly methods: ModelMethodGetters<T>
}

type ReferenceFunctions = {
  readonly [s: string]: () => ReferenceValueType<any>
}

type IPropertyValidators = {
  readonly [s: string]: IPropertyValidator
}

type IModelInstance<T extends FunctionalModel> = {
  readonly get: Getters<T> & { readonly id: () => PrimaryKeyType|Promise<PrimaryKeyType>},
  readonly methods: InterfaceMethodGetters<T>,
  readonly references: ReferenceFunctions,
  readonly toObj: () => Promise<FunctionalObj>,
  readonly getPrimaryKey: () => string,
  readonly validators: IPropertyValidators,
  readonly validate: (options?: {}) => Promise<IModelErrors>,
  readonly getModel: () => IModel<T>,
}

type IModelMethodTyped<T extends FunctionalModel> = (model: IModel<T>, args?: readonly any[]) => any
type IModelMethod = IModelMethodTyped<any>
type IModelMethodClient = (...args: readonly any[]) => any
type IModelInstanceMethodTyped<T extends FunctionalModel> = (instance: IModelInstance<T>, args?: readonly any[]) => any
type IModelInstanceMethod = IModelInstanceMethodTyped<any>
type IModelInstanceMethodClient = (...args: readonly any[]) => any
type IModelInstanceList<T extends FunctionalObj> = {
  readonly [s: string]: IModelInstanceMethodTyped<T>
}

type ModelOptions = {
  readonly instanceCreatedCallback: Nullable<Arrayable<(instance: IModelInstance<any>) => void>>
}

type OptionalModelOptions = {
  readonly instanceCreatedCallback?: Nullable<Arrayable<(instance: IModelInstance<any>) => void>>
}|undefined


export {
  IModelInstance,
  IModel,
  IPropertyValidatorComponent,
  IPropertyValidatorComponentSync,
  IPropertyValidatorComponentAsync,
  IPropertyValidatorComponentType,
  IPropertyValidator,
  IModelValidator,
  IModelComponentValidator,
  IPropertyInstance,
  IPropertyConfig,
  FunctionalType,
  IValueGetter,
  MaybeFunction,
  FunctionalObj,
  Maybe,
  ReferenceValueType,
  Arrayable,
  IModelDefinition,
  Nullable,
  ModelOptions,
  IModelMethod,
  OptionalModelOptions,
  IReferenceProperty,
  Getters,
  IPropertyValidators,
  IPropertyValidatorComponentTypeAdvanced,
  IModelInstanceMethod,
  IModelInstanceMethodTyped,
  FunctionalModel,
  IModelInstanceList,
  CreateInstanceInput,
  IModelMethodTyped,
  ModelMethodGetters,
  InterfaceMethodGetters,
  ReferenceFunctions,
  IModelErrors,
}
/* eslint-enable no-unused-vars */
