import {IModelInstanceMethodTyped, IModelInstance, FunctionalModel, IModel, IModelMethodTyped} from './interfaces'

const Function = (method: Function) => (wrapped: any) => () => {
  return method(wrapped)
}

const InstanceMethod = <T extends FunctionalModel>(method: (instance: IModelInstance<T>, args?: readonly any[]) => any ) => {
  const r : IModelInstanceMethodTyped<T> = (instance: IModelInstance<T>, ...args: readonly any[]) => {
    return method(instance, ...args)
  }
  return r
}

const ModelMethod = <T extends FunctionalModel>(method: (model: IModel<T>, args?: readonly any[]) => any ) => {
  const r : IModelMethodTyped<T> = (model: IModel<T>, ...args: readonly any[]) => {
    console.log("A MODEL METHOD CALLED")
    console.log(args)
    return method(model, ...args)
  }
  return r
}

export {
  Function,
  InstanceMethod,
  ModelMethod,
}
