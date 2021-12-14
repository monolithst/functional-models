import {
  IModelInstanceMethodTyped,
  IModelInstance,
  FunctionalModel,
  IModel,
  IModelMethodTyped,
} from './interfaces'

const InstanceMethod = <T extends FunctionalModel>(
  method: (instance: IModelInstance<T>, args?: readonly any[]) => any
) => {
  const r: IModelInstanceMethodTyped<T> = (
    instance: IModelInstance<T>,
    ...args: readonly any[]
  ) => {
    return method(instance, ...args)
  }
  return r
}

const ModelMethod = <T extends FunctionalModel>(
  method: (model: IModel<T>, args?: readonly any[]) => any
) => {
  const r: IModelMethodTyped<T> = (
    model: IModel<T>,
    ...args: readonly any[]
  ) => {
    return method(model, ...args)
  }
  return r
}

export { InstanceMethod, ModelMethod }
