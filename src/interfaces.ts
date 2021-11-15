
type ValueIsOfType<T,V> = {
  readonly [ P in keyof T as T[P] extends V ? P : never ] : P
} & keyof T

type InstanceFunctionGetters<T> = ValueIsOfType<T, IModelInstanceFunction>
type ModelFunctionGetters<T> = ValueIsOfType<T, IModelFunction>
type ModelFunctionTypes = IModelFunction|IModelInstanceFunction

type Getters<T> = {
  readonly [Property in keyof T as T[Property] extends ModelFunctionTypes ? never : Property]: () => Promise<T[Property]>
} & [keyof T]


type MaybeFunction<T> = T | (() => T)
type Nullable<T> = T | null
type Maybe<T> = T | undefined | null
type Arrayable<T> = T | readonly T[]
type IMaybeLazy<T> = Maybe<Promise<T>>

type FunctionalModel = {
  [s: string]: Arrayable<number> |
    Arrayable<string> |
    Arrayable<boolean> |
    Arrayable<null> |
    Arrayable<FunctionalObj> |
    Arrayable<Date> |
    IModelInstanceFunction |
    IModelFunction |
    undefined,
}

type FunctionalObj = {
  [s: string]: Arrayable<number> |
    Arrayable<string> |
    Arrayable<boolean> |
    Arrayable<null> |
    Arrayable<FunctionalObj> |
    Arrayable<Date> |
    undefined,
}

type FunctionalType = Arrayable<number> | Arrayable<string> | Arrayable<boolean> | Arrayable<null> | Arrayable<undefined> | Arrayable<FunctionalObj> | Arrayable<Date>

interface IPropertyValidatorComponentTypeAdvanced<TValue, TModel extends FunctionalObj> {
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


interface IPropertyValidator {
  (instance: IModelInstance<any>, instanceData: FunctionalObj, options?: object): Promise<readonly string[]>
}

interface IModelErrors {
  readonly [s: string]: readonly string[]
}

interface IModelComponentValidator {
  (instance: IModelInstance<any>, instanceData: FunctionalObj, options?: object): Promise<readonly string[]>
}

interface IModelValidator {
  (instance: IModelInstance<any>, instanceData: FunctionalObj, options?: object): Promise<IModelErrors>
}

type IValueGetter = () => Promise<Arrayable<FunctionalType>>

interface IPropertyInstance<T extends Arrayable<FunctionalType>> {
  readonly getConfig: () => object,
  readonly getChoices: () => readonly string[],
  readonly getDefaultValue: () => T,
  readonly getConstantValue: () => T,
  readonly getPropertyType: () => string,
  readonly createGetter: (value: T) => IValueGetter,
  readonly getValidator: (valueGetter: IValueGetter) => IPropertyValidator,
}

interface IReferenceProperty<T extends FunctionalObj> extends IPropertyInstance<T|string> {
  readonly getReferencedId: (instanceValues: ReferenceValueType<T>) => string|null|undefined,
  readonly getReferencedModel: () => IModel<T>
}

interface IProperty<T extends Arrayable<FunctionalType>> {
  (type: string, config: IPropertyConfig, additionalMetadata?: object): IPropertyInstance<T>
}

type ReferenceValueType<T extends FunctionalObj> = IModelInstance<T> | T | string | undefined | null

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
  readonly valueSelector?: (instanceValue: Arrayable<FunctionalType>) => Arrayable<FunctionalType>,
  readonly validators?: readonly IPropertyValidatorComponent[],
  readonly maxLength?: number,
  readonly minLength?: number,
  readonly maxValue?: number,
  readonly minValue?: number,
  readonly autoNow?: boolean,
  readonly fetcher?: (model: IModel<any>, primaryKey: string) => Promise<any>
}

type IPropertyConfig = IPropertyConfigContents & IDefaultPropertyValidators | undefined


type IModelType = {
  [s: string]: FunctionalObj
}

type IModelDefinition1<T extends FunctionalModel> = {
  readonly [s: string] : IPropertyInstance<T>|IReferenceProperty<T>
}

type IModelDefinition<T extends FunctionalModel> = ValueIsOfType<T,
  IPropertyInstance<any>|
  IReferenceProperty<any>|
  IModelInstanceFunction
  >
  //readonly [s: string] : IPropertyInstance<any>|IReferenceProperty<any>
//}

type IModelDefinition2<T extends FunctionalObj> = {
  //readonly data: ValueIsOfType<T, FunctionalObj>,
  readonly data: ValueIsOfType<T, IPropertyInstance<T>|IReferenceProperty<T>>
  readonly methods?: InstanceFunctionGetters<T>,
  readonly modelMethods?: ModelFunctionGetters<T>,
}

const md = (def: IModelDefinition2<{
  data: {
  },
  methods: {},
  modelMethods: {

  }}>) => {
  return {
    data: null,
    methods: null,
    modelMethods: null,
  }
}

type IModel<T extends FunctionalObj> = {
  readonly getName: () => string,
  readonly getPrimaryKeyName: () => string,
  readonly getModelDefinition: () => IModelDefinition<T>,
  readonly getPrimaryKey: (t: T) => string,
  readonly create: (data: T) => IModelInstance<T>,
}

type ReferenceFunctions = {
  readonly [s: string]: () => ReferenceValueType<any>
}

type IPropertyValidators = {
  readonly [s: string]: IPropertyValidator
}

type IReferenceProperties = {
  readonly [s: string]: IReferenceProperty<any>
}

type IModelFunctions = {
  readonly [s: string]: IModelFunction
}

type IModelInstance<T extends FunctionalObj> = {
  readonly get: Getters<T>,
  readonly functions: InstanceFunctionGetters<T>,
  readonly references: ReferenceFunctions,
  readonly toObj: () => Promise<FunctionalObj>,
  readonly getPrimaryKey: () => string,
  readonly validators: IPropertyValidators,
  readonly validate: (options: {}) => IModelErrors,
  readonly getModel: () => IModel<T>,
}

type IModelFunctionTyped<T extends FunctionalObj> = (model: IModel<T>, args?: any[]) => any
type IModelFunction = (model: IModel<any>, args?: any[]) => any
type IModelInstanceFunctionTyped<T extends FunctionalObj> = (instance: IModelInstance<T>, args?: any[]) => any
type IModelInstanceFunction = (instance: IModelInstance<any>, args?: any[]) => any

type ModelOptions = {
  primaryKey: string
  getPrimaryKeyProperty: () => IPropertyInstance<string>
  instanceCreatedCallback: Nullable<Arrayable<(instance: IModelInstance<any>) => void>>
  modelFunctions: {
    [s: string]: IModelFunction
  }
  instanceFunctions: {
    [s: string]: IModelInstanceFunction
  }
  modelValidators: IModelComponentValidator[]
}

type OptionalModelOptions = {
  primaryKey?: string
  getPrimaryKeyProperty?: () => IPropertyInstance<string>
  instanceCreatedCallback?: Nullable<Arrayable<(instance: IModelInstance<any>) => void>>
  modelFunctions?: {
    [s: string]: IModelFunction
  }
  instanceFunctions?: {
    [s: string]: IModelInstanceFunction
  }
  modelValidators?: IModelComponentValidator[]
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
  IProperty,
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
  IModelFunction,
  OptionalModelOptions,
  IReferenceProperty,
  Getters,
  IPropertyValidators,
  IPropertyValidatorComponentTypeAdvanced,
  IReferenceProperties,
  IModelInstanceFunction,
  IModelInstanceFunctionTyped,
  IModelDefinition2,
  FunctionalModel,
}
/* eslint-enable no-unused-vars */
