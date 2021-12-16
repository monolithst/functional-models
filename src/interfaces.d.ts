declare type MaybeFunction<T> = T | (() => T);
declare type MaybePromise<T> = T | Promise<T>;
declare type Nullable<T> = T | null;
declare type Maybe<T> = T | undefined | null;
declare type Arrayable<T> = T | readonly T[];
declare type MaybeLazy<T> = Maybe<Promise<T>>;
declare type MaybeEmpty<T> = T | null | undefined;
declare type JsonAble = number | string | boolean | null | Arrayable<{
    readonly [s: string]: JsonAble;
}>;
declare type VeryPrimitivesTypes = null | string | number | boolean;
declare type toObj = () => Promise<JsonAble>;
declare type ValueIsOfType<T, V> = {
    readonly [P in keyof T as T[P] extends V ? P : never]: T[P];
};
declare type ValueIsNotOfType<T, V> = {
    readonly [P in keyof T as T[P] extends V ? never : P]: T[P];
};
declare type InstanceMethodGetters<T> = {
    readonly [P in keyof T as T[P] extends ModelInstanceMethod ? P : never]: ModelInstanceMethodClient;
};
declare type ModelMethodGetters<T> = {
    readonly [P in keyof T as T[P] extends ModelMethod ? P : never]: ModelMethodClient;
};
declare type ModelMethodTypes<T extends FunctionalModel> = ModelMethod | ModelInstanceMethod | ModelMethodTyped<T> | ModelInstanceMethodTyped<T>;
declare type PropertyGetters<T extends FunctionalModel> = {
    readonly [Property in keyof T as T[Property] extends ModelMethodTypes<T> ? never : Property]: () => T[Property] | Promise<T[Property]>;
};
declare type FunctionalModel = {
    readonly [s: string]: Arrayable<number> | Arrayable<string> | Arrayable<boolean> | Arrayable<null> | Arrayable<FunctionalModel> | Arrayable<Date> | Arrayable<undefined> | ReferenceValueType<any> | ModelInstanceMethod | ModelMethod;
} | JsonAble;
declare type FunctionalType = JsonAble | (() => FunctionalType) | Arrayable<undefined> | Arrayable<Date> | Arrayable<FunctionalModel> | Arrayable<{
    readonly [s: string]: JsonAble;
}>;
declare type ModelInstanceInputData<T extends FunctionalModel> = ValueIsNotOfType<T, ModelMethodTypes<T>> | JsonAble;
declare type PropertyValidatorComponentTypeAdvanced<TValue, TModel extends FunctionalModel> = (value: TValue, instance: ModelInstance<TModel>, instanceData: FunctionalModel) => string | undefined;
declare type PropertyValidatorComponentType<TValue> = (value: TValue, instance: ModelInstance<any>, instanceData: FunctionalModel) => string | undefined;
declare type PropertyValidatorComponentSync = PropertyValidatorComponentType<any>;
declare type PropertyValidatorComponentAsync = (value: Arrayable<FunctionalModel>, instance: ModelInstance<any>, instanceData: FunctionalModel) => Promise<string | undefined>;
declare type PropertyValidatorComponent = PropertyValidatorComponentSync | PropertyValidatorComponentAsync;
declare type PropertyValidator = (instance: ModelInstance<any>, instanceData: FunctionalModel) => Promise<ValidationErrors>;
declare type ValidationError = string | undefined;
declare type ValidationErrors = readonly ValidationError[];
declare type ModelError = string;
declare type ModelErrors = {
    readonly [s: string]: readonly ModelError[];
};
declare type ModelComponentValidator = (instance: ModelInstance<any>, instanceData: FunctionalModel, options?: object) => Promise<ValidationErrors>;
declare type ValueGetter = () => MaybePromise<Arrayable<FunctionalType>> | MaybePromise<ModelInstance<any>>;
declare type PropertyInstance<T extends Arrayable<FunctionalType>> = {
    readonly getConfig: () => object;
    readonly getChoices: () => readonly VeryPrimitivesTypes[];
    readonly getDefaultValue: () => T;
    readonly getConstantValue: () => T;
    readonly getPropertyType: () => string;
    readonly createGetter: (value: T) => ValueGetter;
    readonly getValidator: (valueGetter: ValueGetter) => PropertyValidator;
};
declare type PropertiesList<T> = {
    readonly [P in keyof T as T[P] extends Arrayable<FunctionalType> ? P : never]: PropertyInstance<any>;
};
interface ReferencePropertyInstance<T extends FunctionalModel> extends PropertyInstance<ModelInstance<T> | T | MaybeEmpty<PrimaryKeyType>> {
    readonly getReferencedId: (instanceValues: ReferenceValueType<T>) => MaybeEmpty<PrimaryKeyType>;
    readonly getReferencedModel: () => Model<T>;
}
declare type ReferenceValueType<T extends FunctionalModel> = ModelInstance<T> | ModelInstanceInputData<T> | string | number | null | undefined;
declare type DefaultPropertyValidators = {
    readonly required?: boolean;
    readonly isInteger?: boolean;
    readonly isNumber?: boolean;
    readonly isString?: boolean;
    readonly isArray?: boolean;
    readonly isBoolean?: boolean;
};
declare type PropertyConfigContents = {
    readonly type?: string;
    readonly defaultValue?: Arrayable<FunctionalType>;
    readonly value?: Arrayable<FunctionalType>;
    readonly choices?: readonly VeryPrimitivesTypes[];
    readonly lazyLoadMethod?: (value: Arrayable<FunctionalType>) => MaybeLazy<Arrayable<FunctionalType>>;
    readonly valueSelector?: (instanceValue: MaybePromise<Arrayable<FunctionalType>>) => Arrayable<FunctionalType>;
    readonly validators?: readonly PropertyValidatorComponent[];
    readonly maxLength?: number;
    readonly minLength?: number;
    readonly maxValue?: number;
    readonly minValue?: number;
    readonly autoNow?: boolean;
    readonly fetcher?: ModelFetcher;
};
declare type ModelFetcher = <T extends FunctionalModel>(model: Model<T>, primaryKey: PrimaryKeyType) => Promise<Maybe<ModelInstance<T> | ModelInstanceInputData<T>>>;
declare type PropertyConfig = (PropertyConfigContents & DefaultPropertyValidators) | undefined;
declare type PrimaryKeyPropertyInstanceType = PropertyInstance<string> | PropertyInstance<number>;
declare type PrimaryKeyType = string | number;
declare type ModelMethods<T extends FunctionalModel> = ValueIsOfType<T, ModelMethod | ModelMethodTyped<T>>;
declare type InstanceMethods<T extends FunctionalModel> = ValueIsOfType<T, ModelInstanceMethod | ModelInstanceMethodTyped<T>>;
declare type ModelDefinition<T extends FunctionalModel> = {
    readonly getPrimaryKeyName?: () => string;
    readonly properties: PropertiesList<T> & {
        readonly id?: PrimaryKeyPropertyInstanceType;
    };
    readonly instanceMethods?: InstanceMethods<T>;
    readonly modelMethods?: ModelMethods<T>;
    readonly modelValidators?: readonly ModelComponentValidator[];
};
declare type ModelFactory = <T extends FunctionalModel>(modelName: string, modelDefinition: ModelDefinition<T>, options?: OptionalModelOptions<T>) => Model<T>;
declare type CreateParams<T extends FunctionalModel> = (ModelInstanceInputData<T> & {
    readonly id?: PrimaryKeyType;
}) | ModelInstanceInputData<T>;
declare type Model<T extends FunctionalModel> = {
    readonly getName: () => string;
    readonly getPrimaryKeyName: () => string;
    readonly getModelDefinition: () => ModelDefinition<T>;
    readonly getPrimaryKey: (t: ModelInstanceInputData<T>) => PrimaryKeyType;
    readonly getOptions: () => object & ModelOptions<T>;
    readonly create: (data: CreateParams<T>) => ModelInstance<T>;
    readonly methods: ModelMethodGetters<T>;
};
declare type ReferenceFunctions = {
    readonly [s: string]: () => ReferenceValueType<any>;
};
declare type PropertyValidators = {
    readonly [s: string]: PropertyValidator;
};
declare type ModelInstance<T extends FunctionalModel> = {
    readonly get: PropertyGetters<T> & {
        readonly id: () => MaybePromise<PrimaryKeyType>;
    };
    readonly methods: InstanceMethodGetters<T>;
    readonly references: ReferenceFunctions;
    readonly toObj: toObj;
    readonly getPrimaryKeyName: () => string;
    readonly getPrimaryKey: () => PrimaryKeyType;
    readonly validators: PropertyValidators;
    readonly validate: (options?: {}) => Promise<ModelErrors>;
    readonly getModel: () => Model<T>;
};
declare type ModelMethodTyped<T extends FunctionalModel> = (model: Model<T>, args?: readonly any[]) => any;
declare type ModelMethod = ModelMethodTyped<any>;
declare type ModelMethodClient = (...args: readonly any[]) => any;
declare type ModelInstanceMethodTyped<T extends FunctionalModel> = (instance: ModelInstance<T>, args?: readonly any[]) => any;
declare type ModelInstanceMethod = ModelInstanceMethodTyped<any>;
declare type ModelInstanceMethodClient = (...args: readonly any[]) => any;
declare type ModelOptions<T extends FunctionalModel> = {
    readonly instanceCreatedCallback: Nullable<Arrayable<(instance: ModelInstance<T>) => void>>;
    readonly [s: string]: any;
};
declare type OptionalModelOptions<T extends FunctionalModel> = {
    readonly instanceCreatedCallback?: Nullable<Arrayable<(instance: ModelInstance<T>) => void>>;
    readonly [s: string]: any;
} | undefined;
export { MaybeFunction, Maybe, MaybePromise, Nullable, Arrayable, MaybeLazy, JsonAble, toObj, ModelInstance, Model, PropertyValidatorComponent, PropertyValidatorComponentSync, PropertyValidatorComponentAsync, PropertyValidatorComponentType, PropertyValidator, ModelComponentValidator, PropertyInstance, PropertyConfig, FunctionalType, ValueGetter, ReferenceValueType, ModelDefinition, ModelOptions, ModelMethod, OptionalModelOptions, ReferencePropertyInstance, PropertyGetters, PropertyValidators, PropertyValidatorComponentTypeAdvanced, ModelInstanceMethod, ModelInstanceMethodTyped, FunctionalModel, ModelInstanceInputData, ModelMethodTyped, ModelMethodGetters, InstanceMethodGetters, ReferenceFunctions, ModelErrors, MaybeEmpty, PrimaryKeyType, ModelFactory, ModelFetcher, CreateParams, };
