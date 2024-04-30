import merge from 'lodash/merge'
import { toJsonAble } from './serialization'
import { createModelValidator } from './validation'
import { UniqueId } from './properties'
import {
  Model,
  Nullable,
  ModelDefinition,
  ModelInstance,
  ModelOptions,
  ModelFactory,
  ModelReferenceFunctions,
  PropertyGetters,
  OptionalModelOptions,
  ModelReferencePropertyInstance,
  ModelReference,
  PropertyValidators,
  FunctionalModel,
  TypedJsonObj,
} from './interfaces'
import { singularize, toTitleCase } from './utils'

const _defaultOptions = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
>(): ModelOptions<T, TModel> => ({
  instanceCreatedCallback: null,
})

const _convertOptions = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
>(
  options?: OptionalModelOptions<T, TModel, TModelInstance>
) => {
  const r: ModelOptions<T, TModel, TModelInstance> = merge(
    {},
    _defaultOptions(),
    options
  )
  return r
}

const _createModelDefWithPrimaryKey = <
  T extends FunctionalModel,
  TModel extends Model<T>,
>(
  modelDefinition: ModelDefinition<T, TModel>
): ModelDefinition<T, TModel> => {
  const properties = merge(
    {
      id: UniqueId({ required: true }),
    },
    modelDefinition.properties
  )
  return {
    ...modelDefinition,
    getPrimaryKeyName: () => 'id',
    properties,
  }
}

const BaseModel: ModelFactory = <
  T extends FunctionalModel,
  TModel extends Model<T> = Model<T>,
  TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
>(
  pluralName: string,
  modelDefinition: ModelDefinition<T, TModel>,
  options?: OptionalModelOptions<T, TModel, TModelInstance>
): TModel => {
  /*
   * This non-functional approach is specifically used to
   * allow instances to be able to refer back to its parent without
   * having to duplicate it for every instance.
   * This is set at the very end and returned, so it can be referenced
   * throughout instance methods.
   */
  // eslint-disable-next-line functional/no-let
  let model: Nullable<TModel> = null
  const theOptions = _convertOptions(options)
  modelDefinition = !modelDefinition.getPrimaryKeyName
    ? _createModelDefWithPrimaryKey<T, TModel>(modelDefinition)
    : modelDefinition

  // @ts-ignore
  const getPrimaryKeyName = () => modelDefinition.getPrimaryKeyName()
  const getPrimaryKey = (loadedInternals: any) => {
    const property = loadedInternals.get[getPrimaryKeyName()]
    return property()
  }

  const create = (instanceValues: TypedJsonObj<T>) => {
    // eslint-disable-next-line functional/no-let
    let instance: Nullable<TModelInstance> = null
    const startingInternals: Readonly<{
      get: PropertyGetters<T> & { id: () => string }
      validators: PropertyValidators<T, TModel>
      references: ModelReferenceFunctions
    }> = {
      get: {} as PropertyGetters<T> & Readonly<{ id: () => string }>,
      validators: {},
      references: {},
    }
    const loadedInternals = Object.entries(modelDefinition.properties).reduce(
      (acc, [key, property]) => {
        const propertyGetter = () => {
          return property.createGetter(
            // @ts-ignore
            instanceValues[key],
            instanceValues,
            instance
          )()
        }
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
        const asReferenced = property as ModelReferencePropertyInstance<
          any,
          any
        >
        const referencedProperty = asReferenced.getReferencedId
          ? {
              references: {
                [key]: () =>
                  asReferenced.getReferencedId(
                    // @ts-ignore
                    instanceValues[key] as ModelReference<any>
                  ),
              },
            }
          : {}

        return merge(acc, fleshedOutInstanceProperties, referencedProperty)
      },
      startingInternals
    )

    const getModel = () => model as TModel
    const toObj = toJsonAble(loadedInternals.get)
    const validate = (options = {}) => {
      return Promise.resolve().then(() => {
        return createModelValidator<T, TModel>(
          loadedInternals.validators,
          modelDefinition.modelValidators || []
        )(instance as TModelInstance, options)
      })
    }

    instance = merge(loadedInternals, {
      getModel,
      toObj,
      getPrimaryKey: () => getPrimaryKey(loadedInternals),
      getPrimaryKeyName,
      validate,
    }) as TModelInstance

    if (theOptions.instanceCreatedCallback) {
      const toCall = Array.isArray(theOptions.instanceCreatedCallback)
        ? theOptions.instanceCreatedCallback
        : [theOptions.instanceCreatedCallback]
      toCall.map(func => func(instance as TModelInstance))
    }
    return instance
  }

  // This sets the model that is used by the instances later.
  // @ts-ignore
  model = merge(
    {},
    {
      create,
      getName: () => pluralName,
      getSingularName: () =>
        modelDefinition.singularName || singularize(pluralName),
      getDisplayName: () =>
        modelDefinition.displayName || toTitleCase(pluralName),
      getModelDefinition: () => modelDefinition,
      getPrimaryKeyName,
      getPrimaryKey,
      getOptions: () => theOptions,
    }
  )
  return model as TModel
}

const Model = BaseModel

export { BaseModel, Model }
