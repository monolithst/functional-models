
interface IModel {
  getName: () => String,
  create: (data: Object) => IModelInstance,
}


interface IModelInstance {
  functions: {
    toObj: () => Promise<any>,
    getPrimaryKey: () => Promise<Number>,
  },
  meta: {
    getModel: () => IModel,
  }
}

interface IPropertyValidator {
  (value: any, instance: IModelInstance, instanceData: Object, options?: Object): String | undefined
}

interface IPropertyValidatorAsync {
  (value: any, instance: IModelInstance, instanceData: Object, options?: Object): Promise<String | undefined>
}

export {
  IModelInstance,
  IModel,
  IPropertyValidator,
  IPropertyValidatorAsync,
}