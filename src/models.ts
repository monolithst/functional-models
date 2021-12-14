import merge from 'lodash/merge'
import { toJsonAble } from './serialization'
import { createModelValidator } from './validation'
import { UniqueId } from './properties'
import {
  IModel,
  InterfaceMethodGetters,
  Nullable,
  IModelDefinition,
  IModelInstance,
  ModelOptions,
  ReferenceFunctions,
  Getters,
  OptionalModelOptions,
  IReferenceProperty,
  ReferenceValueType,
  IPropertyValidators,
  FunctionalModel,
  CreateInstanceInput,
  IModelInstanceMethodTyped,
  IModelMethodTyped,
  ModelMethodGetters,
} from './interfaces'

const _defaultOptions = (): ModelOptions => ({
  instanceCreatedCallback: null,
})

const _convertOptions = (options?: OptionalModelOptions) => {
  const r: ModelOptions = merge({}, _defaultOptions(), options)
  return r
}

const _createModelDefWithPrimaryKey = <T extends FunctionalModel>(
  keyToProperty: IModelDefinition<T>
): IModelDefinition<T> => {
  return {
    getPrimaryKey: () => 'id',
    modelMethods: keyToProperty.modelMethods,
    instanceMethods: keyToProperty.instanceMethods,
    properties: {
      id: UniqueId({ required: true }),
      ...keyToProperty.properties,
    },
    modelValidators: keyToProperty.modelValidators,
  }
}

const Model = <T extends FunctionalModel>(
  modelName: string,
  keyToProperty: IModelDefinition<T>,
  //keyToProperty: IModelDefinition2<T>,
  options?: OptionalModelOptions
) => {
  /*
   * This non-functional approach is specifically used to
   * allow instances to be able to refer back to its parent without
   * having to duplicate it for every instance.
   * This is set at the very end and returned, so it can be referenced
   * throughout instance methods.
   */
  // eslint-disable-next-line functional/no-let
  let model: Nullable<IModel<T>> = null
  const theOptions = _convertOptions(options)
  keyToProperty = !keyToProperty.getPrimaryKey
    ? _createModelDefWithPrimaryKey(keyToProperty)
    : keyToProperty

  // @ts-ignore
  const getPrimaryKeyName = () => keyToProperty.getPrimaryKey()
  const getPrimaryKey = (t: CreateInstanceInput<T>) =>
    // @ts-ignore
    t[getPrimaryKeyName()] as string

  const create = (instanceValues: CreateInstanceInput<T>) => {
    // eslint-disable-next-line functional/no-let
    let instance: Nullable<IModelInstance<T>> = null
    const startingInternals: {
      readonly get: Getters<T> & { readonly id: () => string }
      readonly validators: IPropertyValidators
      readonly references: ReferenceFunctions
    } = {
      get: {} as Getters<T> & { readonly id: () => string },
      validators: {},
      references: {},
    }
    const loadedInternals = Object.entries(keyToProperty.properties).reduce(
      (acc, [key, property]) => {
        // @ts-ignore
        const propertyGetter = property.createGetter(instanceValues[key])
        // @ts-ignore
        const propertyValidator = property.getValidator(propertyGetter)
        const fleshedOutInstanceProperties = {
          get: {
            [key]: propertyGetter,
          },
          validators: {
            [key]: propertyValidator,
          },
        }
        const asReferenced = property as IReferenceProperty<any>
        const referencedProperty = asReferenced.getReferencedId
          ? {
              references: {
                [key]: () =>
                  asReferenced.getReferencedId(
                    // @ts-ignore
                    instanceValues[key] as ReferenceValueType<any>
                  ),
              },
            }
          : {}

        return merge(acc, fleshedOutInstanceProperties, referencedProperty)
      },
      startingInternals
    )
    const methods = Object.entries(keyToProperty.instanceMethods || {}).reduce(
      (acc, [key, func]) => {
        return merge(acc, {
          [key]: (...args: readonly any[]) => {
            return (func as IModelInstanceMethodTyped<T>)(
              instance as IModelInstance<T>,
              ...args
            )
          },
        })
      },
      {}
    ) as InterfaceMethodGetters<T>

    const getModel = () => model as IModel<T>
    const toObj = toJsonAble(loadedInternals.get)
    const validate = (options = {}) => {
      return createModelValidator(
        loadedInternals.validators,
        keyToProperty.modelValidators || []
      )(instance as IModelInstance<T>, options)
    }

    instance = merge(loadedInternals, {
      getModel,
      toObj,
      getPrimaryKey: () => getPrimaryKey(instanceValues),
      validate,
      methods,
    })

    if (theOptions.instanceCreatedCallback) {
      const toCall = Array.isArray(theOptions.instanceCreatedCallback)
        ? theOptions.instanceCreatedCallback
        : [theOptions.instanceCreatedCallback]
      toCall.map(func => func(instance as IModelInstance<T>))
    }
    return instance
  }

  const fleshedOutModelFunctions = Object.entries(
    keyToProperty.modelMethods || {}
  ).reduce((acc, [key, func]) => {
    return merge(acc, {
      [key]: (...args: readonly any[]) => {
        return (func as IModelMethodTyped<T>)(model as IModel<T>, ...args)
      },
    })
  }, {}) as ModelMethodGetters<T>

  // This sets the model that is used by the instances later.
  model = merge(
    {},
    {
      create,
      getName: () => modelName,
      getModelDefinition: () => keyToProperty,
      getPrimaryKeyName,
      getPrimaryKey,
      methods: fleshedOutModelFunctions,
    }
  )
  return model as IModel<T>
}

export { Model }
