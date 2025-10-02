import { OpenAPIV3 } from 'openapi-types'
import kebabCase from 'lodash/kebabCase'
import flow from 'lodash/flow'
import merge from 'lodash/merge'
import get from 'lodash/get'
import { z, ZodType } from 'zod'
import {
  ApiInfo,
  ApiInfoPartialRest,
  ApiMethod,
  Arrayable,
  DataDescription,
  DataValue,
  ModelInstance,
  PrimaryKeyType,
  PropertyConfig,
  PropertyValidatorComponent,
  PropertyValidatorComponentTypeAdvanced,
  RestInfo,
  RestInfoMinimum,
} from './types'
import { createHeadAndTail } from './utils'
import {
  emptyValidator,
  maxNumber,
  maxTextLength,
  minNumber,
  minTextLength,
} from './validation'
import HttpMethods = OpenAPIV3.HttpMethods

const NULL_ENDPOINT = 'NULL'
const NULL_METHOD = HttpMethods.HEAD
const ID_KEY = ':id'

const getValueForReferencedModel = async (
  modelInstance: ModelInstance<any>,
  path: string
): Promise<PrimaryKeyType | any> => {
  const [head, tail] = createHeadAndTail(path.split('.'), '.')
  // If there are no nested keys, just return the reference id.
  if (!tail) {
    return modelInstance.getReferences()[head]()
  }
  const modelReference = await modelInstance.get[head]()
  if (modelReference.toObj) {
    const [nestedHead, nestedTail] = createHeadAndTail(tail.split('.'), '.')
    const value = await modelReference.get[nestedHead]()
    if (nestedTail) {
      return get(value, nestedTail)
    }
    return value
  }
  return get(modelReference, tail)
}

const getValueForModelInstance = async (
  modelInstance: ModelInstance<any>,
  path: string
): Promise<PrimaryKeyType | any> => {
  const [head, tail] = createHeadAndTail(path.split('.'), '.')
  const value = await modelInstance.get[head]()
  return tail ? get(value, tail) : value
}

const isReferencedProperty = (
  modelInstance: ModelInstance<any>,
  key: string
) => {
  return modelInstance.getReferences()[key]
}

const getCommonTextValidators = (
  config: PropertyConfig<string>
): readonly PropertyValidatorComponent<any>[] => {
  return [
    getValidatorFromConfigElseEmpty(config?.maxLength, maxTextLength),
    getValidatorFromConfigElseEmpty(config?.minLength, minTextLength),
  ]
}

const getValidatorFromConfigElseEmpty = <
  T extends DataDescription,
  TValue extends DataValue,
>(
  input: TValue | undefined,

  validatorGetter: (t: TValue) => PropertyValidatorComponent<T>
): PropertyValidatorComponent<T> => {
  if (input !== undefined) {
    const validator = validatorGetter(input)
    return validator
  }
  return emptyValidator
}

const getCommonNumberValidators = (
  config: PropertyConfig<number>
): readonly PropertyValidatorComponent<any>[] => {
  return [
    getValidatorFromConfigElseEmpty(config?.minValue, minNumber),
    getValidatorFromConfigElseEmpty(config?.maxValue, maxNumber),
  ]
}

const mergeValidators = <TValue extends Arrayable<DataValue>>(
  config: PropertyConfig<TValue> | undefined,
  ...validators: readonly (
    | PropertyValidatorComponent<any>
    | PropertyValidatorComponentTypeAdvanced<any, any>
  )[]
): PropertyValidatorComponent<any>[] => {
  return [...validators, ...(config?.validators ? config.validators : [])]
}

const isModelInstance = (obj: any): obj is ModelInstance<any, any> => {
  // @ts-ignore
  return Boolean(obj && obj.getPrimaryKey)
}

const getModelName = (namespace: string, pluralName: string) => {
  return kebabCase(`${namespace}-${pluralName}`).toLowerCase()
}

const buildValidEndpoint = (...components: readonly string[]) => {
  const suffix = components
    .map(x => {
      if (x === ID_KEY) {
        return x
      }
      return kebabCase(x)
    })
    .map(s => s.toLowerCase())
    .join('/')
  return `/${suffix}`
}

const _generateRestInfo =
  (method: HttpMethods, withId: boolean, ...additional: readonly string[]) =>
  (pluralName: string, namespace: string) =>
  (existing?: RestInfoMinimum): RestInfo => {
    if (existing) {
      return {
        // Default add security, then override it.
        security: {},
        ...existing,
      }
    }
    const endpoint = withId
      ? buildValidEndpoint(namespace, pluralName, ID_KEY)
      : buildValidEndpoint(namespace, pluralName, ...additional)
    return {
      method,
      endpoint,
      // We cannot auto create security.
      security: {},
    }
  }

const _apiMethodToRestInfoGenerator = {
  [ApiMethod.create]: _generateRestInfo(HttpMethods.POST, false),
  [ApiMethod.retrieve]: _generateRestInfo(HttpMethods.GET, true),
  [ApiMethod.update]: _generateRestInfo(HttpMethods.PUT, true),
  [ApiMethod.delete]: _generateRestInfo(HttpMethods.DELETE, true),
  [ApiMethod.search]: _generateRestInfo(HttpMethods.POST, false, 'search'),
}

const getNullRestInfo = () => {
  return {
    endpoint: NULL_ENDPOINT,
    method: NULL_METHOD,
    security: {},
  }
}

const _fillOutRestInfo = (
  pluralName: string,
  namespace: string,
  partial: Partial<ApiInfoPartialRest> | undefined,
  nullRest: Record<ApiMethod, RestInfo>
) => {
  const finishedRestInfo: Record<ApiMethod, RestInfo> = Object.entries(
    ApiMethod
  ).reduce(
    (acc, [, method]) => {
      const existing =
        partial && partial.rest && partial.rest[method]
          ? partial.rest[method]
          : undefined
      const restInfo = _apiMethodToRestInfoGenerator[method](
        pluralName,
        namespace
      )(existing)
      return merge(acc, {
        [method]: restInfo,
      })
    },
    nullRest as Record<ApiMethod, RestInfo>
  )
  return {
    noPublish: false,
    onlyPublish: [],
    rest: finishedRestInfo,
    createOnlyOne: partial?.createOnlyOne || false,
  }
}

const populateApiInformation = (
  pluralName: string,
  namespace: string,
  partial: Partial<ApiInfoPartialRest> | undefined
): Readonly<Required<ApiInfo>> => {
  const nullRest = {
    delete: getNullRestInfo(),
    search: getNullRestInfo(),
    update: getNullRestInfo(),
    retrieve: getNullRestInfo(),
    create: getNullRestInfo(),
  }

  if (!partial) {
    return _fillOutRestInfo(pluralName, namespace, partial, nullRest)
  }
  // Are we not going to publish at all? All "nulled" out.
  if (partial.noPublish) {
    return {
      onlyPublish: [],
      noPublish: true,
      rest: nullRest,
      createOnlyOne: false,
    }
  }

  const rest: Partial<Record<ApiMethod, RestInfoMinimum>> = partial.rest || {}
  // Should we only publish some but not all?
  if (partial.onlyPublish && partial.onlyPublish.length > 0) {
    return partial.onlyPublish.reduce(
      (acc, method) => {
        const restInfo = _apiMethodToRestInfoGenerator[method](
          pluralName,
          namespace
        )(rest[method])
        return merge(acc, {
          rest: {
            [method]: restInfo,
          },
        })
      },
      {
        noPublish: false,
        onlyPublish: partial.onlyPublish,
        createOnlyOne: Boolean(partial.createOnlyOne),
        rest: nullRest,
      } as ApiInfo
    )
  }
  return _fillOutRestInfo(pluralName, namespace, partial, nullRest)
}

/**
 * Create a zod schema generator for a property given its type and config.
 * Returns a function that when called produces the zod schema.
 */
const createZodForProperty =
  (propertyType: any, config?: PropertyConfig<any>) => () => {
    const myConfig: PropertyConfig<any> = config || {}
    const provided = myConfig.zod
    if (provided) {
      return provided as ZodType<any>
    }

    const _getZodForPropertyType = (pt: any) => {
      switch (pt) {
        case 'UniqueId':
          return z.string()
        case 'Date':
        case 'Datetime':
          return z.union([z.string(), z.date()])
        case 'Integer':
          return z.number().int()
        case 'Number':
          return z.number()
        case 'Boolean':
          return z.boolean()
        case 'Array':
          return z.array(z.any())
        case 'Object':
          return z.object().loose()
        case 'Email':
          return z.email()
        case 'Text':
        case 'BigText':
          return z.string()
        case 'ModelReference':
          return z.union([z.string(), z.number()])
        default:
          return z.any()
      }
    }

    const baseSchema = _getZodForPropertyType(propertyType)
    const choices = (config as any)?.choices
    const schemaFromChoices =
      choices && Array.isArray(choices) && choices.length > 0
        ? z.union(choices.map((c: any) => z.literal(c)) as any)
        : baseSchema

    const finalSchema = flow([
      s =>
        typeof myConfig.minValue === 'number' ? s.min(myConfig.minValue) : s,
      s =>
        typeof myConfig.maxValue === 'number' ? s.max(myConfig.maxValue) : s,
      s =>
        typeof myConfig.minLength === 'number' ? s.min(myConfig.minLength) : s,
      s =>
        typeof myConfig.maxLength === 'number' ? s.max(myConfig.maxLength) : s,
      s =>
        myConfig.defaultValue !== undefined
          ? s.default(myConfig.defaultValue)
          : s,
      s => (myConfig.required ? s : s.optional()),
      s => (myConfig.description ? s.describe(myConfig.description) : s),
    ])(schemaFromChoices)

    return finalSchema as ZodType<any>
  }

export {
  isReferencedProperty,
  getValueForModelInstance,
  getValueForReferencedModel,
  getCommonTextValidators,
  getValidatorFromConfigElseEmpty,
  getCommonNumberValidators,
  mergeValidators,
  isModelInstance,
  getModelName,
  buildValidEndpoint,
  populateApiInformation,
  NULL_ENDPOINT,
  NULL_METHOD,
  createZodForProperty,
}
