import {
  ModelInstanceMethod,
  ModelInstance,
  FunctionalModel,
  Model,
  ModelMethod,
} from './interfaces'

type InstanceMethodInput<T extends FunctionalModel, TModel extends Model<T>> = (
  instance: ModelInstance<T, TModel>,
  model: TModel,
  ...args: readonly any[]
) => any
type MethodInput<T extends FunctionalModel, TModel extends Model<T>> = (
  model: TModel,
  ...args: readonly any[]
) => any

function WrapperInstanceMethod<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
>(method: InstanceMethodInput<T, TModel>): ModelInstanceMethod<T, TModel> {
  const r: ModelInstanceMethod<T, TModel> = (
    instance: ModelInstance<T, TModel>,
    model: TModel,
    ...args: readonly any[]
  ) => {
    return method(instance, model, args)
  }
  return r
}

function WrapperModelMethod<
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>
>(method: MethodInput<T, TModel>): ModelMethod<T, TModel> {
  const r: ModelMethod<T, TModel> = (
    model: TModel,
    ...args: readonly any[]
  ) => {
    return method(model, args)
  }
  return r
}

export { WrapperInstanceMethod, WrapperModelMethod }
