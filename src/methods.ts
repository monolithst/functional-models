import {
  ModelInstanceMethodTyped,
  ModelInstance,
  FunctionalModel,
  Model,
  ModelMethodTyped, MethodArgs,
} from './interfaces'

const WrapperInstanceMethod = <T extends FunctionalModel>(
  method: (model: Model<T>, instance: ModelInstance<T>, args?: MethodArgs) => any
) => {
  const r: ModelInstanceMethodTyped<T> = (
    model: Model<T>,
    instance: ModelInstance<T>,
    ...args: readonly any[]
  ) => {
    return method(model, instance, args)
  }
  return r
}

const WrapperModelMethod = <T extends FunctionalModel>(
  method: (model: Model<T>, args?: MethodArgs) => any
) => {
  const r: ModelMethodTyped<T> = (model: Model<T>, args?: MethodArgs) => {
    return method(model, args)
  }
  return r
}

export { WrapperInstanceMethod, WrapperModelMethod }
