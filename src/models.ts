import merge from 'lodash/merge'
import { toJsonAble } from './serialization'
import { createModelValidator } from './validation'
import {
  CreateParams,
  DataDescription,
  MinimalModelDefinition,
  ModelDefinition,
  ModelErrors,
  ModelFactory,
  ModelInstance,
  ModelFactoryOptions,
  ModelReferenceType,
  ModelReferenceFunctions,
  ModelReferencePropertyInstance,
  ModelType,
  Nullable,
  PropertyGetters,
  PropertyInstance,
  PropertyValidators,
  RestInfo,
  ToObjectFunction,
  ModelInstanceFetcher,
} from './types'
import {
  getModelName,
  NULL_ENDPOINT,
  NULL_METHOD,
  populateApiInformation,
} from './lib'
import { memoizeAsync, memoizeSync, singularize, toTitleCase } from './utils'

const _defaultOptions = <
  T extends DataDescription,
>(): ModelFactoryOptions<T> => ({
  instanceCreatedCallback: undefined,
})

const _convertOptions = <T extends DataDescription>(
  options?: ModelFactoryOptions<T>
) => {
  const r: ModelFactoryOptions<T> = merge({}, _defaultOptions(), options)
  return r
}

const _toModelDefinition = <T extends DataDescription>(
  minimal: MinimalModelDefinition<T>
): ModelDefinition<T> => {
  return {
    singularName: singularize(minimal.pluralName),
    displayName: toTitleCase(minimal.pluralName),
    description: '',
    primaryKeyName: 'id',
    modelValidators: [],
    ...minimal,
  }
}

const _validateModelDefinition = <T extends DataDescription>(
  modelDefinition: MinimalModelDefinition<T>
) => {
  const primaryKeyName = modelDefinition.primaryKeyName || 'id'
  const primaryKeyProperty =
    // @ts-ignore
    modelDefinition.properties[primaryKeyName]
  if (!primaryKeyProperty) {
    throw new Error(`Property missing for primaryKey named ${primaryKeyName}`)
  }
  if (!modelDefinition.pluralName) {
    throw new Error(`Must include pluralName for model.`)
  }
  if (!modelDefinition.namespace) {
    throw new Error(`Must include namespace for model.`)
  }
}

/**
 * An out of the box ModelFactory that can create Models.
 * @param options - Any additional model options
 * @returns A simple Model function ready for creating models. See {@link ModelType}
 */
const Model: ModelFactory = <T extends DataDescription>(
  minimalModelDefinitions: MinimalModelDefinition<T>,
  options?: ModelFactoryOptions<T>
): ModelType<T> => {
  _validateModelDefinition(minimalModelDefinitions)
  /*
   * This non-functional approach is specifically used to
   * allow instances to be able to refer back to its parent without
   * having to duplicate it for every instance.
   * This is set at the very end and returned, so it can be referenced
   * throughout instance methods.
   */
  // eslint-disable-next-line functional/no-let
  let model: Nullable<ModelType<T>> = null
  const theOptions = _convertOptions(options)
  const modelDefinition = _toModelDefinition(minimalModelDefinitions)

  const getPrimaryKeyName = () => modelDefinition.primaryKeyName
  const getPrimaryKey = (loadedInternals: any) => {
    const property = loadedInternals.get[getPrimaryKeyName()]
    return property()
  }

  const create = <IgnorePrimaryKeyName extends string = ''>(
    instanceValues: CreateParams<T, IgnorePrimaryKeyName>
  ) => {
    // eslint-disable-next-line functional/no-let
    let instance: Nullable<ModelInstance<T>> = null
    const startingInternals: Readonly<{
      get: PropertyGetters<T>
      validators: PropertyValidators<T>
      references: ModelReferenceFunctions
    }> = {
      get: {} as PropertyGetters<T> & Readonly<{ id: () => string }>,
      validators: {},
      references: {},
    }

    const prop: [string, PropertyInstance<any>][] = Object.entries(
      modelDefinition.properties
    )
    const loadedInternals = prop.reduce(
      (acc, [key, property]) => {
        const propertyGetter = memoizeSync(() =>
          property.createGetter(
            //@ts-ignore
            instanceValues[key],
            instanceValues,
            // NOTE: By the time it gets here, it has already been implemented.
            instance as ModelInstance<any>
          )()
        )
        const propertyValidator = property.getValidator(propertyGetter)
        const fleshedOutInstanceProperties = {
          get: {
            [key]: () => propertyGetter(),
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
                    instanceValues[key] as ModelReferenceType<any>
                  ),
              },
            }
          : {}

        return merge(
          acc,
          fleshedOutInstanceProperties,
          referencedProperty
        ) as Readonly<{
          get: PropertyGetters<T>
          validators: PropertyValidators<T>
          references: ModelReferenceFunctions
        }>
      },
      startingInternals as Readonly<{
        get: PropertyGetters<T>
        validators: PropertyValidators<T>
        references: ModelReferenceFunctions
      }>
    )

    const getModel = () => model as ModelType<T>

    // We are casting this, because the output type is really complicated.
    // and memoizing this is very important.
    // @ts-ignore
    const toObj = memoizeAsync(() => {
      return toJsonAble(loadedInternals.get)()
    }) as ToObjectFunction<T>

    const validate = memoizeAsync((options = {}) => {
      return Promise.resolve().then(() => {
        return createModelValidator<T, ModelType<T>>(
          loadedInternals.validators,
          modelDefinition.modelValidators
        )(instance as ModelInstance<T>, options)
      }) as Promise<ModelErrors<T> | undefined>
    })

    const getReferences = () => loadedInternals.references
    const getValidators = () => loadedInternals.validators

    // @ts-ignore
    instance = {
      get: loadedInternals.get,
      getReferences,
      getValidators,
      getModel,
      toObj,
      getPrimaryKey: () => getPrimaryKey(loadedInternals),
      validate,
    } as ModelInstance<T>

    if (theOptions.instanceCreatedCallback) {
      const toCall = Array.isArray(theOptions.instanceCreatedCallback)
        ? theOptions.instanceCreatedCallback
        : [theOptions.instanceCreatedCallback]
      toCall.map(func => func(instance as ModelInstance<T>))
    }
    return instance
  }

  const getApiInfo = memoizeSync(() => {
    return populateApiInformation(
      modelDefinition.pluralName,
      modelDefinition.namespace,
      modelDefinition.api
    )
  })

  // This sets the model that is used by the instances later.
  model = {
    /**
     * Creates a model instance.
     */
    create,
    getName: () =>
      getModelName(modelDefinition.namespace, modelDefinition.pluralName),
    getModelDefinition: memoizeSync(() => modelDefinition),
    getPrimaryKey,
    getApiInfo,
  }
  return model as ModelType<T>
}

/**
 * A useful function for determining if a RestInfo found in an ApiInfo is "null" or not.
 * That is, whether it should be used and considered.
 * @param restInfo
 */
const isNullRestInfo = (restInfo: RestInfo): boolean => {
  return restInfo.method === NULL_METHOD && restInfo.endpoint === NULL_ENDPOINT
}

/**
 * A ModelInstanceFetcher that does not do anything. It always returns undefined.
 */
const noFetch: ModelInstanceFetcher = () => {
  return Promise.resolve(undefined)
}

export { Model, isNullRestInfo, noFetch }
