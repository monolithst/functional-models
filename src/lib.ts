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
  ModelType,
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

const _checkAB = (check: boolean, a: any, b: any) => {
  return check ? a : b
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
      if (myConfig.choices) {
        return z.enum(myConfig.choices as any)
      }
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
      // Attach description for Zod consumers and OpenAPI generators.
      s => {
        if (myConfig.description) {
          // zod's describe helps Zod introspection; some zod-openapi versions expect metadata via .meta or .openapi
          // Use .describe and also attach .meta with openapi description if available.
          if (typeof s.openapi === 'function') {
            return s.openapi({ description: myConfig.description })
          }
          return s.meta
            ? s.meta({ description: myConfig.description })
            : s.describe(myConfig.description)
        }
        return s
      },
    ])(schemaFromChoices)

    return finalSchema as ZodType<any>
  }

const isWrapperType = (
  explicitType: string | undefined,
  typeString: string | undefined
) => {
  return (
    explicitType === 'ZodOptional' ||
    explicitType === 'ZodNullable' ||
    explicitType === 'ZodDefault' ||
    typeString === 'optional' ||
    typeString === 'nullable' ||
    typeString === 'nullish' ||
    typeString === 'default'
  )
}

const getInnerType = (defRef: any) => {
  return (
    defRef.innerType ||
    defRef.type ||
    defRef.schema ||
    defRef.payload ||
    defRef.value ||
    defRef.inner ||
    (defRef._def && (defRef._def.inner || defRef._def.type)) ||
    (defRef && defRef.innerType)
  )
}

const unwrapOnce = (s: any) => {
  const defRef = s && (s._def || s.def)
  if (!defRef) {
    return s
  }
  const explicitType =
    defRef && defRef.typeName ? String(defRef.typeName) : undefined
  const typeString =
    !explicitType && defRef && typeof defRef.type === 'string'
      ? String(defRef.type)
      : undefined
  const isWrapper = isWrapperType(explicitType, typeString)
  if (!isWrapper) {
    return s
  }
  return getInnerType(defRef) || s
}

const recur = (s: any): any => {
  const next = unwrapOnce(s)
  return next === s ? s : recur(next)
}

const modelToOpenApi = <
  TData extends DataDescription,
  TModel extends ModelType<TData>,
>(
  model: TModel
) => {
  const zodSchema: any = model.getModelDefinition().schema
  const modelProps = (model.getModelDefinition() as any).properties || {}
  const propConfigMap: Record<string, any> = Object.keys(modelProps).reduce(
    (acc: Record<string, any>, k) =>
      merge(acc, {
        [k]: merge(modelProps[k].getConfig ? modelProps[k].getConfig() : {}, {
          propertyType: modelProps[k].getPropertyType
            ? modelProps[k].getPropertyType()
            : undefined,
        }),
      }),
    {}
  )

  const unwrap = (schema: ZodType<any>): ZodType<any> => {
    // Functional recursive unwrapping of common Zod wrappers.
    return recur(schema) as ZodType<any>
  }

  // --- small helpers extracted to reduce complexity ---
  const getTypeName = (defRef: any) => {
    if (!defRef) {
      return ''
    }
    if (typeof defRef.type === 'string') {
      return (
        'Zod' +
        String(defRef.type).charAt(0).toUpperCase() +
        String(defRef.type).slice(1)
      )
    }
    if (defRef.typeName) {
      return String(defRef.typeName)
    }
    return ''
  }

  const extractStringBounds = (defRef: any, s: any) => {
    const checks =
      (defRef && defRef.checks) || (s && s._def && (s._def as any).checks) || []
    return Array.isArray(checks)
      ? checks.reduce(
          (acc: { min?: number; max?: number }, c: any) => {
            if (!c || typeof c !== 'object') {
              return acc
            }
            const candidateMin =
              (c.kind === 'min' ||
                c.check === 'min' ||
                (c.def && c.def.type === 'min')) &&
              typeof c.value === 'number'
                ? c.value
                : c.def && typeof c.def.minLength === 'number'
                  ? c.def.minLength
                  : undefined
            const candidateMax =
              (c.kind === 'max' ||
                c.check === 'max' ||
                (c.def && c.def.type === 'max')) &&
              typeof c.value === 'number'
                ? c.value
                : c.def && typeof c.def.maxLength === 'number'
                  ? c.def.maxLength
                  : undefined
            return {
              min: candidateMin !== undefined ? candidateMin : acc.min,
              max: candidateMax !== undefined ? candidateMax : acc.max,
            }
          },
          {} as { min?: number; max?: number }
        )
      : {}
  }

  const getCandidateMin = (c: any) => {
    return (c.kind === 'min' ||
      c.check === 'min' ||
      (c.def && c.def.type === 'min')) &&
      typeof c.value === 'number'
      ? c.value
      : c.def && typeof c.def.minValue === 'number'
        ? c.def.minValue
        : undefined
  }

  const getCandidateMax = (c: any) => {
    return (c.kind === 'max' ||
      c.check === 'max' ||
      (c.def && c.def.type === 'max')) &&
      typeof c.value === 'number'
      ? c.value
      : c.def && typeof c.def.maxValue === 'number'
        ? c.def.maxValue
        : undefined
  }

  const isIntegerCheck = (c: any, acc: { isInteger?: boolean }) => {
    return (
      acc.isInteger ||
      (c &&
        (c.kind === 'int' ||
          c.check === 'int' ||
          c === 'int' ||
          JSON.stringify(c).includes('int')))
    )
  }

  const extractNumberInfo = (defRef: any, s: any) => {
    const checks =
      (defRef && defRef.checks) || (s && s._def && (s._def as any).checks) || []
    return Array.isArray(checks)
      ? checks.reduce(
          (
            acc: { min?: number; max?: number; isInteger?: boolean },
            c: any
          ) => {
            if (!c || typeof c !== 'object') {
              return acc
            }
            const candidateMin = getCandidateMin(c)
            const candidateMax = getCandidateMax(c)
            const isInt = isIntegerCheck(c, acc)
            return {
              min: candidateMin !== undefined ? candidateMin : acc.min,
              max: candidateMax !== undefined ? candidateMax : acc.max,
              isInteger: isInt,
            }
          },
          {} as { min?: number; max?: number; isInteger?: boolean }
        )
      : {}
  }

  const getLiteralOpenApi = (defRef: any, s: any) => {
    const candidates = [
      defRef && (defRef.value !== undefined ? defRef.value : undefined),
      defRef &&
        defRef._def &&
        (defRef._def.value !== undefined ? defRef._def.value : undefined),
      s && s._def && (s._def.value !== undefined ? s._def.value : undefined),
      (s as any) && (s as any).value,
    ]
    const val: any = candidates.find((c: any) => c !== undefined)
    const t = typeof val
    if (t === 'string') {
      return { type: 'string', enum: [val] }
    }
    /*
    if (t === 'number') {
      return { type: 'number', enum: [val] }
    }
    if (t === 'boolean') {
      return { type: 'boolean', enum: [val] }
    }
      */
    return { enum: [val] }
  }

  const getEnumValues = (defRef: any, s: any) => {
    const candidates = [
      s && (s as any)._def && (s as any)._def.values,
      s && (s as any)._def && (s as any)._def.options,
      (s as any).values,
      (s as any).options,
      defRef && defRef.values,
      defRef && defRef.options,
      defRef && defRef._def && defRef._def.values,
      defRef && defRef._def && defRef._def.options,
    ]
    const found = candidates.find((c: any) => Array.isArray(c) && c.length > 0)
    return Array.isArray(found) ? found : []
  }

  const handleZodObject = (s: any, defRef: any, depth: number) => {
    const asAny = s as any
    const shape: Record<string, ZodType<any>> = asAny &&
    typeof asAny.shape === 'function'
      ? asAny.shape()
      : //: defRef && typeof defRef.shape === 'function'
        //? defRef.shape()
        defRef.shape || defRef.properties || {}
    if (!shape || Object.keys(shape).length === 0) {
      return { type: 'object' }
    }

    const keys = Object.keys(shape || {})
    const getChildDescription = (sChild: any, childSchema: any) => {
      return (
        (sChild &&
          (sChild.description ||
            (sChild._def && sChild._def.description) ||
            (sChild.def && sChild.def.description))) ||
        ((childSchema as any) &&
          (((childSchema as any)._def &&
            (childSchema as any)._def.description) ||
            ((childSchema as any).def && (childSchema as any).def.description)))
      )
    }

    const getWithDescription = (
      childOpen: any,
      modelProp: any,
      descFromDef: any,
      depth: number
    ) => {
      return modelProp && modelProp.description && depth === 0
        ? merge({}, childOpen, { description: modelProp.description })
        : descFromDef
          ? merge({}, childOpen, { description: descFromDef })
          : childOpen
    }

    const getAdjustedProperties = (modelProp: any, withDesc: any) => {
      return modelProp
        ? withDesc &&
          (withDesc.type === 'number' || withDesc.type === 'integer')
          ? merge(
              {},
              withDesc,
              typeof modelProp.minValue === 'number'
                ? { minimum: modelProp.minValue }
                : {},
              typeof modelProp.maxValue === 'number'
                ? { maximum: modelProp.maxValue }
                : {}
            )
          : withDesc && withDesc.type === 'string'
            ? merge(
                {},
                withDesc,
                typeof modelProp.minLength === 'number'
                  ? { minimum: modelProp.minLength }
                  : {},
                typeof modelProp.maxLength === 'number'
                  ? { maximum: modelProp.maxLength }
                  : {}
              )
            : withDesc
        : withDesc
    }

    const _getRequired = (childTypeName: string, acc: any, key: string) => {
      return childTypeName !== 'ZodOptional' &&
        childTypeName !== 'ZodNullable' &&
        childTypeName !== 'ZodDefault'
        ? (acc.required || []).concat(key)
        : acc.required || []
    }

    const _getChildTypeName = (childDef: any) => {
      return (
        'Zod' + childDef.type.charAt(0).toUpperCase() + childDef.type.slice(1)
      )
    }

    const handleChildSchema = (
      key: string,
      childSchema: any,
      depth: number,
      acc: any
    ) => {
      const childOpen = zodToOpenApi(childSchema, depth + 1) || {}
      const sChild = unwrap(childSchema) as any
      const descFromDef = getChildDescription(sChild, childSchema)
      const modelProp =
        propConfigMap && propConfigMap[key] ? propConfigMap[key] : undefined

      const withDesc = getWithDescription(
        childOpen,
        modelProp,
        descFromDef,
        depth
      )

      const childIsEmptyObject =
        withDesc &&
        withDesc.type === 'object' &&
        (!withDesc.properties ||
          Object.keys(withDesc.properties).length === 0) &&
        !withDesc.additionalProperties

      if (
        (!withDesc ||
          Object.keys(withDesc).length === 0 ||
          childIsEmptyObject) &&
        modelProp &&
        modelProp.propertyType === 'Object'
      ) {
        const newProp = _checkAB(
          modelProp.required,
          { type: 'object' },
          { type: 'object', nullable: true }
        )
        return {
          properties: merge(acc.properties, { [key]: newProp }),
          required: _checkAB(
            modelProp.required && depth === 0,
            (acc.required || []).concat(key),
            acc.required || []
          ),
        }
      }

      const adjusted = getAdjustedProperties(modelProp, withDesc)

      const childDef = (childSchema &&
        ((childSchema as any)._def || (childSchema as any).def)) as any
      const childTypeName = _getChildTypeName(childDef)
      const newRequired = _getRequired(childTypeName, acc, key)

      return {
        properties: merge(acc.properties, { [key]: adjusted }),
        required: newRequired,
      }
    }

    const reduced = keys.reduce((acc, key) => {
      const childSchema = shape[key]
      /*
      if (!childSchema) {
        return acc
      }
        */
      return handleChildSchema(key, childSchema, depth, acc)
    }, {})

    const out: any = {
      type: 'object',
      properties: reduced.properties,
      additionalProperties: false,
    }
    const objectDesc =
      (defRef &&
        ((defRef._def && defRef._def.description) ||
          (defRef.def && defRef.def.description) ||
          defRef.description)) ||
      undefined
    const finalOut = merge(
      {},
      out,
      objectDesc ? { description: objectDesc } : {},
      _checkAB(
        reduced.required.length && depth === 0,
        { required: reduced.required },
        {}
      )
    )
    return finalOut
  }

  const handleZodUnion = (s: any, defRef: any) => {
    const options = defRef && defRef.options
    //(defRef._def && defRef._def.options) ||
    //(s && (s._def as any).options))
    const arr = Array.isArray(options) ? options : Object.values(options || {})

    const reduced = arr.reduce(
      (acc, opt: any) => {
        if (!acc.allLiterals) {
          return acc
        }
        const sOpt = unwrap(opt) as any
        const dOpt = (sOpt && (sOpt._def || sOpt.def)) as any
        const optTypeName =
          'Zod' + dOpt.type.charAt(0).toUpperCase() + dOpt.type.slice(1)
        if (optTypeName === 'ZodLiteral' || optTypeName === 'ZodEnum') {
          const candidates = [
            dOpt && (dOpt.value !== undefined ? dOpt.value : undefined),
            dOpt &&
              dOpt._def &&
              (dOpt._def.value !== undefined ? dOpt._def.value : undefined),
            sOpt &&
              sOpt._def &&
              (sOpt._def.value !== undefined ? sOpt._def.value : undefined),
            (sOpt as any) && (sOpt as any).value,
            (opt as any) && (opt as any).options,
          ]
          const val = candidates.find((c: any) => c !== undefined)
          if (val !== '__array__') {
            return {
              allLiterals: true,
              literalValues: acc.literalValues.concat(val),
            }
          }
          return { allLiterals: true, literalValues: acc.literalValues }
        }
        return { allLiterals: false, literalValues: acc.literalValues }
      },
      { allLiterals: true, literalValues: [] as any[] }
    )

    if (reduced.allLiterals && reduced.literalValues.length > 0) {
      const unique = Array.from(new Set(reduced.literalValues))
      const allStrings = unique.every(v => typeof v === 'string')
      if (allStrings) {
        return { type: 'string', enum: unique }
      }
      /*
      if (allNumbers) {
        return { type: 'number', enum: unique }
      }
        */
    }

    const optionTypes = arr.map((opt: any) => {
      const od = opt && ((opt._def || opt.def) as any)
      /*
      if (!od) {
        return undefined
      }
      if (od.typeName) {
        return od.typeName
      }
        */
      if (typeof od.type === 'string') {
        return 'Zod' + od.type.charAt(0).toUpperCase() + od.type.slice(1)
      }
      return undefined
    })

    if (
      optionTypes.includes('ZodDate') ||
      (optionTypes.includes('ZodString') && optionTypes.includes('ZodNumber'))
    ) {
      return { type: 'string' }
    }

    return undefined
  }

  const handleZodString = (defRef: any, s: any) => {
    const reduced = extractStringBounds(defRef, s)
    return merge(
      {},
      { type: 'string' },
      typeof reduced.min === 'number' ? { minimum: reduced.min } : {},
      typeof reduced.max === 'number' ? { maximum: reduced.max } : {}
    )
  }

  const _handleZodArray = (defRef: any, s: any, depth: number) => {
    // Zod stores the item schema in different places depending on version.
    // Prefer candidates that look like Zod schema objects (have _def/def).
    const candidates = [
      defRef.element,
      defRef.inner,
      defRef.schema,
      defRef.type,
      s && s._def && s._def.element,
      s && s._def && s._def.inner,
      s && s._def && s._def.schema,
    ]
    const itemsSchema: any = candidates.find(
      (c: any) => c && typeof c === 'object' && (c._def || c.def)
    )

    // If we didn't find an object schema, but there's a non-object candidate (string), skip it.
    const openItems = itemsSchema ? zodToOpenApi(itemsSchema, depth + 1) : {}

    return { type: 'array', items: openItems }
  }

  const getCandidates = (defRef: any, s: any) => {
    return [
      s && s._def && (s._def as any).valueType,
      s && s._def && (s._def as any).value,
      s && s._def && (s._def as any).type,
      defRef && defRef.valueType,
      defRef && defRef.value,
      defRef && defRef.type,
      defRef && defRef._def && defRef._def.valueType,
      defRef && defRef._def && defRef._def.value,
      defRef && defRef._def && defRef._def.type,
      defRef && defRef._def && defRef._def.element,
      defRef && defRef.element,
    ]
  }

  const _handleZodRecord = (defRef: any, s: any) => {
    const candidates = getCandidates(defRef, s)
    const valueType: any = candidates.find((c: any) => c)
    const resolved =
      valueType &&
      _checkAB(
        valueType._def || valueType.def || typeof valueType === 'object',
        valueType,
        undefined
      )
    return {
      type: 'object',
      additionalProperties: zodToOpenApi(resolved || z.any()),
    }
  }

  const zodToOpenApi = (schema: ZodType<any>, depth = 0): any => {
    const s = unwrap(schema) as any
    const defRef = (s && (s._def || s.def)) as any
    const typeName = getTypeName(defRef)
    switch (typeName) {
      case 'ZodString':
        return handleZodString(defRef, s)
      case 'ZodNumber': {
        const info = extractNumberInfo(defRef, s)
        return merge(
          {},
          { type: _checkAB(info.isInteger, 'integer', 'number') },
          _checkAB(typeof info.min === 'number', { minimum: info.min }, {}),
          _checkAB(typeof info.max === 'number', { maximum: info.max }, {})
        )
      }
      /*
      case 'ZodBigInt':
        return { type: 'integer' }
      */
      case 'ZodBoolean':
        return { type: 'boolean' }
      /*
      case 'ZodDate':
        return { type: 'string', format: 'date-time' }
      */
      case 'ZodLiteral': {
        return getLiteralOpenApi(defRef, s)
      }
      case 'ZodEnum': {
        return { type: 'string', enum: getEnumValues(defRef, s) }
      }
      /*
      case 'ZodNativeEnum': {
        // Native enum extraction - handle array, object map, or _def enum
        const candidates = [
          s && (s as any)._def && (s as any)._def.values,
          s && (s as any)._def && (s as any)._def.options,
          s && (s as any)._def && (s as any)._def.enum,
          (s as any).values,
          (s as any).options,
          defRef && defRef.values,
          defRef && defRef.options,
          defRef && defRef.enum,
          defRef && defRef._def && defRef._def.enum,
        ]
        const raw = candidates.find((c: any) => c !== undefined && c !== null)
        const values = Array.isArray(raw) ? raw : Object.values(raw || {})
        const unique = Array.from(new Set(values))
        // prefer string enums when possible
        const allStrings = unique.every(v => typeof v === 'string')
        return allStrings ? { type: 'string', enum: unique } : { enum: unique }
      }
        */
      case 'ZodArray': {
        return _handleZodArray(defRef, s, depth)
      }
      case 'ZodObject': {
        return handleZodObject(defRef, s, depth)
      }
      case 'ZodUnion': {
        return handleZodUnion(defRef, s)
      }
      case 'ZodRecord': {
        return _handleZodRecord(defRef, s)
      }

      /*
      case 'ZodAny':
      //case 'ZodUnknown':
        */
      default:
        return {}
    }
  }

  // Build top-level schema
  const result = zodToOpenApi(zodSchema)
  // Ensure top-level result is an object schema
  const normalized =
    //!result || result.type !== 'object'
    //  ? { type: 'object', properties: {}, required: [], ...(result || {}) }
    result

  return normalized
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
  modelToOpenApi,
}
