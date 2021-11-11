/* eslint-disable no-unused-vars */
import {choices, isArray, isBoolean, isInteger, isNumber, isRequired, isString} from "./validation";

interface IModel<T> {
  readonly getName: () => string,
  readonly create: (data: Object) => IModelInstance<T>
}

type IModelProperties<T> = {
  readonly [s: string]: IModelInstance<T>
}

interface Getters<T> {
}


type IModelInstance<T> = {
    /*
  readonly functions: {
    readonly toObj: () => Promise<any>,
    readonly getPrimaryKey: () => Promise<Number>,
    readonly validators: {
      readonly [s: string]: IPropertyValidator
    },
  },

     */
  readonly meta: {
    readonly getModel: () => IModel<T>,
  },
  //readonly [Property in keyof T as Exclude<T, "meta" > `get${Capitalize<string & Property>}`] : any () => T[Property]
  readonly [Property in keyof T as Exclude<T, "meta">]: () => Type[Property]
}

type IModelValue = string | boolean | number | Object | Date

interface IPropertyValidatorComponentType<T> {
  (value: T, instance: IModelInstance, instanceData: Object): string | undefined
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
  (value: any, instance: IModelInstance, instanceData: Object): Promise<string | undefined>
}

interface IPropertyValidator {
  (value: any, instance: IModelInstance, instanceData: Object, options?: Object): Promise<readonly string[]>
}

interface IModelErrors {
  readonly [s: string]: readonly string[]
}

interface IModelComponentValidator {
  (instance: IModelInstance, instanceData: Object, options?: Object): Promise<readonly string[]>
}

interface IModelValidator {
  (instance: IModelInstance, instanceData: Object, options?: Object): Promise<IModelErrors>
}

type IValueGetter = () => any | undefined | null

interface IPropertyInstance {
  readonly getConfig: () => Object,
  readonly getChoices: () => readonly string[],
  readonly getDefaultValue: () => any | undefined,
  readonly getConstantValue: () => any | undefined,
  readonly getPropertyType: () => string,
  readonly createGetter: (value: any) => IValueGetter,
  readonly getValidator: (valueGetter: IValueGetter) => IPropertyValidator,
}

interface IProperty {
  (type: string, config: IPropertyConfig, additionalMetadata?: Object): IPropertyInstance
}

interface ITypedProperty {
  (config: IPropertyConfig, additionalMetadata?: Object): IPropertyInstance
}

type ILazyMethod = ((value: any) => Promise<any>)

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
  readonly lazyLoadMethod?: ILazyMethod,
  readonly valueSelector?: (instanceValue: any) => any,
  readonly validators?: readonly IPropertyValidatorComponent[],
  readonly maxLength?: number,
  readonly minLength?: number,
  readonly maxValue?: number,
  readonly minValue?: number,
  readonly autoNow?: boolean,
}

type IPropertyConfig = IPropertyConfigContents & IDefaultPropertyValidators | undefined
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
}
/* eslint-enable no-unused-vars */
