/* eslint-disable no-unused-vars */
import {choices, isArray, isBoolean, isInteger, isNumber, isRequired, isString} from "./validation";

interface IModel<T> {
  readonly getName: () => string,
  readonly getPrimaryKeyName: () => string,
  readonly getPrimaryKey: (t: T) => string,
  readonly create: (data: T) => IModelInstance<T>
}

type IModelProperties<T> = {
  readonly [s: string]: IModelInstance<T>
}

type IModelInstance<T> = {
  readonly functions: {
    readonly toObj: () => Promise<any>,
    readonly getPrimaryKey: () => string,
    readonly validators: {
      readonly [s: string]: IPropertyValidator
    },
  },
  readonly meta: {
    readonly getModel: () => IModel<T>,
  },
}

type IModelValue = string | boolean | number | Object | Date

interface IPropertyValidatorComponentType<T> {
  (value: T, instance: IModelInstance<any>, instanceData: Object): string | undefined
}

interface IPropertyValidatorComponentSync extends IPropertyValidatorComponentType<any> {
}

type IPropertyValidatorComponent = IPropertyValidatorComponentSync | IPropertyValidatorComponentAsync

/*
{
  (value: any, instance: IModelInstance, instanceData: Object): string | undefined
}

 */


interface IPropertyValidatorComponentAsync {
  (value: any, instance: IModelInstance<any>, instanceData: Object): Promise<string | undefined>
}

interface IPropertyValidator {
  (value: any, instance: IModelInstance<any>, instanceData: Object, options?: Object): Promise<readonly string[]>
}

interface IModelErrors {
  readonly [s: string]: readonly string[]
}

interface IModelComponentValidator {
  (instance: IModelInstance<any>, instanceData: Object, options?: Object): Promise<readonly string[]>
}

interface IModelValidator {
  (instance: IModelInstance<any>, instanceData: Object, options?: Object): Promise<IModelErrors>
}


type FunctionalObj = {
  [s: string]: number | string | boolean | null | FunctionalObj
}

type FunctionalType = number | string | boolean | null | undefined | FunctionalObj | Date
type IValueGetter = () => Promise<FunctionalType>

interface IPropertyInstance<T extends FunctionalType> {
  readonly getConfig: () => Object,
  readonly getChoices: () => readonly string[],
  readonly getDefaultValue: () => FunctionalType,
  readonly getConstantValue: () => FunctionalType,
  readonly getPropertyType: () => string,
  readonly createGetter: (value: T) => IValueGetter,
  readonly getValidator: (valueGetter: IValueGetter) => IPropertyValidator,
}

interface IProperty<T extends FunctionalType> {
  (type: string, config: IPropertyConfig, additionalMetadata?: Object): IPropertyInstance<T>
}

interface ITypedProperty<T extends FunctionalType> {
  (config: IPropertyConfig, additionalMetadata?: Object): IPropertyInstance<T>
}

type ILazyValue<T extends FunctionalType> = null|undefined|T|Promise<T>
type ILazyMethod<T extends FunctionalType> = ((value?: T) => ILazyValue<T>)

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
  readonly defaultValue?: string,
  readonly value?: string,
  readonly choices?: readonly string[],
  readonly lazyLoadMethod?: <T extends FunctionalType>(value? : T) => ILazyValue<T>
  readonly valueSelector?: (instanceValue: any) => any,
  readonly validators?: readonly IPropertyValidatorComponent[],
  readonly maxLength?: number,
  readonly minLength?: number,
  readonly maxValue?: number,
  readonly minValue?: number,
  readonly autoNow?: boolean,
  readonly fetcher?: <T extends FunctionalType>(model: IModel<T>, primaryKey: String) => Promise<T>
}

type IPropertyConfig = IPropertyConfigContents & IDefaultPropertyValidators | undefined
type MaybeFunction<T> = T | (() => T)

/*
  readonly type?: string,
  readonly defaultValue?: string,
  readonly value?: string,
  readonly choices?: readonly string[],
  readonly lazyLoadMethod?: ILazyMethod,
  readonly valueSelector?: (instanceValue: any) => any,
  readonly validators?: readonly IPropertyValidatorComponent[],
  readonly maxLength?: number,
  readonly minLength?: number,
  readonly maxValue?: number,
  readonly minValue?: number,
  readonly autoNow?: boolean,
}

 */

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
  IModelProperties,
  IProperty,
  IPropertyInstance,
  IPropertyConfig,
  FunctionalType,
  IValueGetter,
  MaybeFunction,
  FunctionalObj,
  ILazyMethod,
  ILazyValue,
}
/* eslint-enable no-unused-vars */
