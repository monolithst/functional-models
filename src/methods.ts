import {
  ModelInstanceMethodTyped,
  ModelInstance,
  FunctionalModel,
  Model,
  ModelMethodTyped,
} from './interfaces'

const WrapperInstanceMethod = <T extends FunctionalModel>(
  method: (instance: ModelInstance<T>, args?: readonly any[]) => any
) => {
  const r: ModelInstanceMethodTyped<T> = (
    instance: ModelInstance<T>,
    ...args: readonly any[]
  ) => {
    return method(instance, ...args)
  }
  return r
}

const WrapperModelMethod = <T extends FunctionalModel>(
  method: (model: Model<T>, args?: readonly any[]) => any
) => {
  const r: ModelMethodTyped<T> = (model: Model<T>, ...args: readonly any[]) => {
    return method(model, ...args)
  }
  return r
}

export { WrapperInstanceMethod, WrapperModelMethod }
