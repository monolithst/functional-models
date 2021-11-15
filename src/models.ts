import merge from 'lodash/merge'
import { toObj } from './serialization'
import { createModelValidator } from './validation'
import { UniqueId } from'./properties'
import {
  IModel,
  FunctionalObj,
  IModelDefinition2,
  Nullable,
  IModelDefinition,
  IModelInstance,
  ModelOptions,
  Getters,
  OptionalModelOptions,
  IReferenceProperty,
  ReferenceValueType,
  IPropertyValidators,
  IReferenceProperties, FunctionalModel,
} from './interfaces'

const MODEL_DEF_KEYS = ['meta', 'functions']


/*
const createModel = () : IModel<{
  name: string,
}> => ({
  getName: () => '',
  getPrimaryKeyName: () => '',
  getPrimaryKey: (t: {}) => '',
  create: (data) => ({
    get: {
      name: () => Promise.resolve(data.name)
    },
    functions: {
      toObj: () => Promise.resolve({}),
      getPrimaryKey: () => '',
      validators: {
      },
    },
    meta: {
      getModel: () => createModel()
    },
  })
})


const modelGetter = (model: IModel<{text: string}>, key: string) => {
  const m = model.create({ text: 'hello' })
  const t = m.get.text()

  return Promise.resolve({})
}

const myconfig : IPropertyConfig = {
  fetcher: modelGetter,
}
 */

const _defaultOptions = () : ModelOptions => ({
  primaryKey: 'id',
  getPrimaryKeyProperty: () => UniqueId({ required: true }),
  instanceCreatedCallback: null,
  modelFunctions: {},
  instanceFunctions: {},
  modelValidators: [],
})

const _convertOptions = (options?: OptionalModelOptions) => {
  const r : ModelOptions = merge({}, _defaultOptions(), options)
  return r
}


const Model = <T extends FunctionalModel>(
  modelName: string,
  keyToProperty: IModelDefinition<T>,
  //keyToProperty: IModelDefinition2<T>,
  options?: OptionalModelOptions,
) => {
  /*
   * This non-functional approach is specifically used to
   * allow instances to be able to refer back to its parent without
   * having to duplicate it for every instance.
   * This is set at the very end and returned, so it can be referenced
   * throughout instance methods.
   */
  // eslint-disable-next-line functional/no-let
  let model : Nullable<IModel<T>> = null
  const theOptions = _convertOptions(options)
  keyToProperty = {
    // this key exists over keyToProperty, so it can be overrided if desired.
    // This is BEFORE, because the ... overrides this.
    [theOptions.primaryKey]: theOptions.getPrimaryKeyProperty(),
    ...keyToProperty,
  } as IModelDefinition<T>

  const instanceProperties = Object.entries(keyToProperty).filter(
    ([key, _]) => !MODEL_DEF_KEYS.includes(key)
  )
  const specialProperties1 = Object.entries(keyToProperty).filter(([key, _]) =>
    MODEL_DEF_KEYS.includes(key)
  )
  const properties : IModelDefinition<T> = instanceProperties.reduce((acc, [key, property]) => {
    return merge(acc, { [key]: property })
  }, {})
  const specialProperties = specialProperties1.reduce(
    (acc, [key, property]) => {
      return merge(acc, { [key]: property })
    },
    {}
  )

  const create = (instanceValues : T) => {
    // eslint-disable-next-line functional/no-let
    let instance : Nullable<IModelInstance<T>> = null
    const specialInstanceProperties1 = MODEL_DEF_KEYS.reduce((acc, key) => {
      if (key in instanceValues) {
        return { ...acc, [key]: instanceValues[key] }
      }
      return acc
    }, {})
    const startingInternals: { get: Getters<T>, validators: IPropertyValidators, references: IReferenceProperties} = {get: {} as Getters<T>, validators: {}, references: {}}
    const loadedInternals = instanceProperties.reduce(
      (acc, [key, property]) => {
        // @ts-ignore
        const propertyGetter = property.createGetter(instanceValues[key])
        const propertyValidator = property.getValidator(propertyGetter)
        const fleshedOutInstanceProperties = {
          get: {
            [key]: propertyGetter,
          },
          validators: {
            [key]: propertyValidator,
          },
        }
        const asReferenced = property as IReferenceProperty<T>
        const referencedProperty = asReferenced
          ? {
            references: {
              [key]: () => asReferenced.getReferencedId(instanceValues[key] as ReferenceValueType<T>)
            }
          }
          : {}

        return merge(acc, fleshedOutInstanceProperties, referencedProperty)
      },
      startingInternals
    )
    // @ts-ignore
    const frameworkProperties = {
      getModel: () => model,
      toObj: toObj(loadedInternals.get as Getters<any>),
      // @ts-ignore
      getPrimaryKey: () => instance?.get[theOptions.primaryKey](),
      validate: (options={}) => {
        return createModelValidator(
          loadedInternals.validators,
          theOptions.modelValidators
        )(instance as IModelInstance<T>, options)
      },
    }
    const fleshedOutInstanceFunctions = Object.entries(
      theOptions.instanceFunctions
    ).reduce((acc, [key, func]) => {
      return merge(acc, {
        [key]: (...args: any[]) => {
          return func(instance as IModelInstance<T>, ...args)
        },
      })
    }, {})
    instance = merge(
      {},
      loadedInternals,
      specialProperties,
      fleshedOutInstanceFunctions,
      frameworkProperties,
      specialInstanceProperties1
    ) as IModelInstance<T>
    if (theOptions.instanceCreatedCallback) {
      if (Array.isArray(theOptions.instanceCreatedCallback)) {
        theOptions.instanceCreatedCallback.forEach(func => func(instance as IModelInstance<T>))
      }
    }
    return instance
  }

  const fleshedOutModelFunctions = Object.entries(theOptions.modelFunctions).reduce(
    (acc, [key, func]) => {
      return merge(acc, {
        [key]: (...args: any[]) => {
          return func(model as IModel<T>, ...args)
        },
      })
    },
    {}
  )

  // This sets the model that is used by the instances later.
  model = merge(fleshedOutModelFunctions, {
    create,
    getName: () => modelName,
    getModelDefinition: () => properties,
    getPrimaryKeyName: () => theOptions.primaryKey,
    getPrimaryKey: (t : T) => t[theOptions.primaryKey] as string,
  })
  return model as IModel<T>
}

export {
  Model,
}
