import {IModelInstanceFunction, IModelInstance, FunctionalObj} from './interfaces'

const Function = (method: Function) => (wrapped: any) => () => {
  return method(wrapped)
}

const InstanceFunction = <T extends FunctionalObj>(method: (instance: IModelInstance<T>, args?: readonly any[]) => any ) => {
  const r : IModelInstanceFunction = (instance: IModelInstance<any>, ...args: readonly any[]) => {
    return method(instance, ...args)
  }
  return r
}

export {
  Function,
  InstanceFunction,
}
