import merge from 'lodash/merge'
import { toJsonAble } from './serialization'
import { createModelValidator } from './validation'
import { UniqueId } from './properties'
import {
  Model,
  InstanceMethodGetters,
  Nullable,
  ModelDefinition,
  ModelInstance,
  ModelOptions,
  ModelFactory,
  ReferenceFunctions,
  PropertyGetters,
  OptionalModelOptions,
  ReferencePropertyInstance,
  ReferenceValueType,
  PropertyValidators,
  FunctionalModel,
  ModelInstanceInputData,
  ModelInstanceMethodTyped,
  ModelMethodTyped,
  ModelMethodGetters,
} from './interfaces'

const _defaultOptions = <T extends FunctionalModel>(): ModelOptions<T> => ({
  instanceCreatedCallback: null,
})

const _convertOptions = <T extends FunctionalModel>(
  options?: OptionalModelOptions<T>
) => {
  const r: ModelOptions<T> = merge({}, _defaultOptions(), options)
  return r
}

const _createModelDefWithPrimaryKey = <T extends FunctionalModel>(
  keyToProperty: ModelDefinition<T>
): ModelDefinition<T> => {
  return {
    getPrimaryKeyName: () => 'id',
    modelMethods: keyToProperty.modelMethods,
    instanceMethods: keyToProperty.instanceMethods,
    properties: {
      id: UniqueId({ required: true }),
      ...keyToProperty.properties,
    },
    modelValidators: keyToProperty.modelValidators,
  }
}

const BaseModel: ModelFactory = <T extends FunctionalModel>(
  modelName: string,
  modelDefinition: ModelDefinition<T>,
  options?: OptionalModelOptions<T>
) => {
  /*
   * This non-functional approach is specifically used to
   * allow instances to be able to refer back to its parent without
   * having to duplicate it for every instance.
   * This is set at the very end and returned, so it can be referenced
   * throughout instance methods.
   */
  // eslint-disable-next-line functional/no-let
  let model: Nullable<Model<T>> = null
  const theOptions = _convertOptions(options)
  modelDefinition = !modelDefinition.getPrimaryKeyName
    ? _createModelDefWithPrimaryKey(modelDefinition)
    : modelDefinition

  // @ts-ignore
  const getPrimaryKeyName = () => modelDefinition.getPrimaryKeyName()
  const getPrimaryKey = (t: ModelInstanceInputData<T>) =>
    // @ts-ignore
    t[getPrimaryKeyName()] as string

  const create = (instanceValues: ModelInstanceInputData<T>) => {
    // eslint-disable-next-line functional/no-let
    let instance: Nullable<ModelInstance<T>> = null
    const startingInternals: {
      readonly get: PropertyGetters<T> & { readonly id: () => string }
      readonly validators: PropertyValidators<T>
      readonly references: ReferenceFunctions
    } = {
      get: {} as PropertyGetters<T> & { readonly id: () => string },
      validators: {},
      references: {},
    }
    const loadedInternals = Object.entries(modelDefinition.properties).reduce(
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
        const asReferenced = property as ReferencePropertyInstance<any, any>
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
    const methods = Object.entries(
      modelDefinition.instanceMethods || {}
    ).reduce((acc, [key, func]) => {
      return merge(acc, {
        [key]: (...args: readonly any[]) => {
          return (func as ModelInstanceMethodTyped<T>)(
            model as Model<T>,
            instance as ModelInstance<T>,
            ...args
          )
        },
      })
    }, {}) as InstanceMethodGetters<T>

    const getModel = () => model as Model<T>
    const toObj = toJsonAble(loadedInternals.get)
    const validate = (options = {}) => {
      return Promise.resolve().then(() => {
        return createModelValidator<T>(
          loadedInternals.validators,
          modelDefinition.modelValidators || []
        )(instance as ModelInstance<T>, options)
      })
    }

    instance = merge(loadedInternals, {
      getModel,
      toObj,
      getPrimaryKey: () => getPrimaryKey(instanceValues),
      getPrimaryKeyName,
      validate,
      methods,
    })

    if (theOptions.instanceCreatedCallback) {
      const toCall = Array.isArray(theOptions.instanceCreatedCallback)
        ? theOptions.instanceCreatedCallback
        : [theOptions.instanceCreatedCallback]
      toCall.map(func => func(instance as ModelInstance<T>))
    }
    return instance
  }

  const fleshedOutModelFunctions = Object.entries(
    modelDefinition.modelMethods || {}
  ).reduce((acc, [key, func]) => {
    return merge(acc, {
      [key]: (...args: readonly any[]) => {
        return (func as ModelMethodTyped<T>)(model as Model<T>, ...args)
      },
    })
  }, {}) as ModelMethodGetters<T>

  // This sets the model that is used by the instances later.
  model = merge(
    {},
    {
      create,
      getName: () => modelName,
      getModelDefinition: () => modelDefinition,
      getPrimaryKeyName,
      getPrimaryKey,
      getOptions: () => theOptions,
      methods: fleshedOutModelFunctions,
    }
  )
  return model as Model<T>
}

export { BaseModel }
