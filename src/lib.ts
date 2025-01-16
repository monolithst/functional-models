import { OpenAPIV3 } from 'openapi-types'
import kebabCase from 'lodash/kebabCase'
import merge from 'lodash/merge'
import get from 'lodash/get'
import {
  ApiInfo,
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

const NULL_ENDPOINT = ''
const NULL_METHOD = HttpMethods.HEAD

const _nullRestInfo: RestInfo = {
  endpoint: NULL_ENDPOINT,
  method: NULL_METHOD,
  security: [],
}

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
    .map(kebabCase)
    .map(s => s.toLowerCase())
    .join('/')
  return `/${suffix}`
}

const _generateRestInfo =
  (method: HttpMethods, withId: boolean, ...additional: readonly string[]) =>
  (pluralName: string, namespace: string) =>
  (existing?: RestInfo): RestInfo => {
    if (existing) {
      return existing
    }
    const endpoint = withId
      ? buildValidEndpoint(pluralName, namespace, ':id')
      : buildValidEndpoint(pluralName, namespace, ...additional)
    return {
      method,
      endpoint,
      security: [],
    }
  }

const _apiMethodToRestInfoGenerator = {
  [ApiMethod.create]: _generateRestInfo(HttpMethods.POST, false),
  [ApiMethod.retrieve]: _generateRestInfo(HttpMethods.GET, true),
  [ApiMethod.update]: _generateRestInfo(HttpMethods.PUT, true),
  [ApiMethod.delete]: _generateRestInfo(HttpMethods.DELETE, true),
  [ApiMethod.search]: _generateRestInfo(HttpMethods.POST, false, 'search'),
}

const populateApiInformation = (
  pluralName: string,
  namespace: string,
  partial: Partial<ApiInfo> | undefined
): Readonly<Required<ApiInfo>> => {
  // Do we have any information at all? If not, create all defaults
  if (!partial) {
    const finishedRestInfo: Record<ApiMethod, RestInfo> = Object.entries(
      ApiMethod
    ).reduce(
      (acc, [, method]) => {
        const restInfo = _apiMethodToRestInfoGenerator[method](
          pluralName,
          namespace
        )(undefined)
        return merge(acc, {
          [method]: restInfo,
        })
      },
      {} as Record<ApiMethod, RestInfo>
    )
    return {
      noPublish: false,
      onlyPublish: [],
      apiToRestInfo: finishedRestInfo,
      createOnlyOne: false,
    }
  }

  // Are we not going to publish at all? All "nulled" out.
  if (partial.noPublish) {
    return {
      onlyPublish: [],
      noPublish: true,
      apiToRestInfo: {
        delete: _nullRestInfo,
        search: _nullRestInfo,
        update: _nullRestInfo,
        retrieve: _nullRestInfo,
        create: _nullRestInfo,
      },
      createOnlyOne: false,
    }
  }

  const apiToRestInfo: Partial<Record<ApiMethod, RestInfo>> =
    partial.apiToRestInfo || {}
  // Should we only publish some but not all?
  if (partial.onlyPublish && partial.onlyPublish.length > 0) {
    return partial.onlyPublish.reduce(
      (acc, method) => {
        // If we have it, then we should use it, otherwise, we'll null it out.
        if (apiToRestInfo[method]) {
          const restInfo = _apiMethodToRestInfoGenerator[method](
            pluralName,
            namespace
          )(apiToRestInfo[method])
          return merge(acc, {
            apiToRestInfo: {
              [method]: restInfo,
            },
          })
        }

        return merge(acc, {
          apiToRestInfo: {
            [method]: _nullRestInfo,
          },
        })
      },
      {
        noPublish: false,
        onlyPublish: partial.onlyPublish,
        createOnlyOne: Boolean(partial.createOnlyOne),
        apiToRestInfo: {},
      } as ApiInfo
    )
  }

  const finishedRestInfo: Record<ApiMethod, RestInfo> = Object.entries(
    ApiMethod
  ).reduce(
    (acc, [, method]) => {
      const restInfo = _apiMethodToRestInfoGenerator[method](
        pluralName,
        namespace
      )(apiToRestInfo[method])
      return merge(acc, {
        [method]: restInfo,
      })
    },
    {} as Record<ApiMethod, RestInfo>
  )

  return {
    noPublish: false,
    onlyPublish: [],
    apiToRestInfo: finishedRestInfo,
    createOnlyOne: partial.createOnlyOne || false,
  }
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
}
