import { assert } from 'chai'
import { Model } from '../../src/models'
import {
  ArrayProperty,
  BooleanProperty,
  DateProperty,
  DatetimeProperty,
  EmailProperty,
  IntegerProperty,
  ModelReferenceProperty,
  NumberProperty,
  ObjectProperty,
  TextProperty,
  PrimaryKeyUuidProperty,
} from '../../src/properties'
import {
  buildValidEndpoint,
  isModelInstance,
  populateApiInformation,
  createZodForProperty,
  modelToOpenApi,
} from '../../src/lib'
import { ApiInfo, ApiMethod } from '../../src/index'
import { z } from 'zod'

describe('/src/lib.ts', () => {
  describe('#populateApiInformation', () => {
    it('should create the expected fully filled out ApiInfo with Null Rest Infos when noPublish=true', () => {
      const actual = populateApiInformation(
        'PluralNames',
        '@package/namespace',
        {
          noPublish: true,
        }
      )
      const expected: ApiInfo = {
        onlyPublish: [],
        noPublish: true,
        createOnlyOne: false,
        rest: {
          create: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
          retrieve: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
          update: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
          delete: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
          search: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create the expected fully filled out ApiInfo when some api info is provided', () => {
      const actual = populateApiInformation(
        'PluralNames',
        '@package/namespace',
        {
          rest: {
            create: {
              endpoint: '/different',
              method: 'patch',
              security: {
                whatever: ['you', 'want'],
              },
            },
          },
        }
      )
      const expected: ApiInfo = {
        onlyPublish: [],
        noPublish: false,
        createOnlyOne: false,
        rest: {
          create: {
            endpoint: '/different',
            method: 'patch',
            security: {
              whatever: ['you', 'want'],
            },
          },
          retrieve: {
            endpoint: '/package-namespace/plural-names/:id',
            method: 'get',
            security: {},
          },
          update: {
            endpoint: '/package-namespace/plural-names/:id',
            method: 'put',
            security: {},
          },
          delete: {
            endpoint: '/package-namespace/plural-names/:id',
            method: 'delete',
            security: {},
          },
          search: {
            endpoint: '/package-namespace/plural-names/search',
            method: 'post',
            security: {},
          },
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create the expected fully filled out ApiInfo when no api info is provided', () => {
      const actual = populateApiInformation(
        'PluralNames',
        '@package/namespace',
        undefined
      )
      const expected: ApiInfo = {
        onlyPublish: [],
        noPublish: false,
        createOnlyOne: false,
        rest: {
          create: {
            endpoint: '/package-namespace/plural-names',
            method: 'post',
            security: {},
          },
          retrieve: {
            endpoint: '/package-namespace/plural-names/:id',
            method: 'get',
            security: {},
          },
          update: {
            endpoint: '/package-namespace/plural-names/:id',
            method: 'put',
            security: {},
          },
          delete: {
            endpoint: '/package-namespace/plural-names/:id',
            method: 'delete',
            security: {},
          },
          search: {
            endpoint: '/package-namespace/plural-names/search',
            method: 'post',
            security: {},
          },
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create the expected fully filled out ApiInfo from a partial, when using onlyPublish', () => {
      const actual = populateApiInformation(
        'PluralNames',
        '@package/namespace',
        {
          onlyPublish: [ApiMethod.retrieve, ApiMethod.update],
          rest: {
            retrieve: {
              endpoint: '/namespace/plural-names/:id',
              method: 'get',
            },
            update: {
              endpoint: '/namespace/plural-names',
              method: 'post',
              security: { 'x-api-key': [] },
            },
          },
        }
      )
      const expected: ApiInfo = {
        onlyPublish: [ApiMethod.retrieve, ApiMethod.update],
        noPublish: false,
        createOnlyOne: false,
        rest: {
          create: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
          retrieve: {
            endpoint: '/namespace/plural-names/:id',
            method: 'get',
            security: {},
          },
          update: {
            endpoint: '/namespace/plural-names',
            method: 'post',
            security: { 'x-api-key': [] },
          },
          delete: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
          search: {
            endpoint: 'NULL',
            method: 'head',
            security: {},
          },
        },
      }
      assert.deepEqual(actual, expected)
    })
  })
  describe('#buildValidEndpoint', () => {
    it('should create /namespace/plural-names/:id', () => {
      const actual = buildValidEndpoint('namespace', 'pluralNames', ':id')
      const expected = '/namespace/plural-names/:id'
      assert.equal(actual, expected)
    })
    it('should create /namespace/plural-names', () => {
      const actual = buildValidEndpoint('namespace', 'pluralNames')
      const expected = '/namespace/plural-names'
      assert.equal(actual, expected)
    })
    it('should create /namespace/plural-names/search', () => {
      const actual = buildValidEndpoint('namespace', 'pluralNames', 'search')
      const expected = '/namespace/plural-names/search'
      assert.equal(actual, expected)
    })
    it('should create /my-complicated-namespace/plural-names/search', () => {
      const actual = buildValidEndpoint(
        '@MyComplicated/namespace',
        'PluralNames',
        'search'
      )
      const expected = '/my-complicated-namespace/plural-names/search'
      assert.equal(actual, expected)
    })
  })
  describe('#isModelInstance()', () => {
    it('should return false if undefined is passed in', () => {
      const actual = isModelInstance(undefined)
      assert.isFalse(actual)
    })
    it('should return false if undefined is passed in', () => {
      // @ts-ignore
      const actual = isModelInstance()
      assert.isFalse(actual)
    })
    it('should return true if object has getPrimaryKey()', () => {
      const actual = isModelInstance({
        getPrimaryKey: () => {},
      })
      assert.isTrue(actual)
    })
  })
  describe('#createZodForProperty()', () => {
    it('UniqueId: accepts string', () => {
      const schema = createZodForProperty('UniqueId')()
      const result = schema.safeParse('abc').success
      assert.isTrue(result)
    })
    it('Date: accepts Date object', () => {
      const schema = createZodForProperty('Date')()
      const result = schema.safeParse(new Date()).success
      assert.isTrue(result)
    })
    it('Integer: accepts integer', () => {
      const schema = createZodForProperty('Integer')()
      const result = schema.safeParse(5).success
      assert.isTrue(result)
    })
    it('Number: accepts float', () => {
      const schema = createZodForProperty('Number')()
      const result = schema.safeParse(1.23).success
      assert.isTrue(result)
    })
    it('Boolean: accepts true', () => {
      const schema = createZodForProperty('Boolean')()
      const result = schema.safeParse(true).success
      assert.isTrue(result)
    })
    it('Array: accepts empty array', () => {
      const schema = createZodForProperty('Array')()
      const result = schema.safeParse([]).success
      assert.isTrue(result)
    })
    it('Object: accepts object', () => {
      const schema = createZodForProperty('Object')()
      const result = schema.safeParse({}).success
      assert.isTrue(result)
    })
    it('Email: accepts valid email', () => {
      const schema = createZodForProperty('Email')()
      const result = schema.safeParse('a@b.com').success
      assert.isTrue(result)
    })
    it('Text: accepts string', () => {
      const schema = createZodForProperty('Text')()
      const result = schema.safeParse('hello').success
      assert.isTrue(result)
    })
    it('ModelReference: accepts number', () => {
      const schema = createZodForProperty('ModelReference')()
      const result = schema.safeParse(123).success
      assert.isTrue(result)
    })
    it('choices: allows listed choice', () => {
      const schema = createZodForProperty('Text', { choices: ['a', 'b'] })()
      const result = schema.safeParse('a').success
      assert.isTrue(result)
    })
    it('minValue: enforces minimum', () => {
      const schema = createZodForProperty('Number', { minValue: 5 })()
      const result = schema.safeParse(5).success
      assert.isTrue(result)
    })
    it('maxValue: enforces maximum', () => {
      const schema = createZodForProperty('Number', { maxValue: 10 })()
      const result = schema.safeParse(10).success
      assert.isTrue(result)
    })
    it('minLength: enforces min length', () => {
      const schema = createZodForProperty('Text', { minLength: 2 })()
      const result = schema.safeParse('ab').success
      assert.isTrue(result)
    })
    it('maxLength: enforces max length', () => {
      const schema = createZodForProperty('Text', { maxLength: 3 })()
      const result = schema.safeParse('abc').success
      assert.isTrue(result)
    })
    it('defaultValue: applies default on undefined', () => {
      const schema = createZodForProperty('Text', { defaultValue: 'x' })()
      const result = schema.parse(undefined)
      assert.equal(result, 'x')
    })
    it('required: when required true, undefined is invalid', () => {
      const schema = createZodForProperty('Text', { required: true })()
      const result = schema.safeParse(undefined).success
      assert.isFalse(result)
    })
    it('description: sets description metadata', () => {
      const schema = createZodForProperty('Text', {
        description: 'This is my description',
      })()
      const desc = schema.description
      assert.equal(desc, 'This is my description')
    })
    it('should use the zod that is passed in via config', () => {
      const zod = z.string()
      const schema = createZodForProperty('Text', { zod: zod })()
      assert.equal(schema, zod)
    })
  })

  describe('#modelToOpenApi()', () => {
    it('maps TextProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'TextModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          field: TextProperty({
            description: 'Description of the field',
            required: true,
            maxLength: 5,
            minLength: 2,
          }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          field: {
            type: 'string',
            description: 'Description of the field',
            maximum: 5,
            minimum: 2,
          },
        },
        required: ['id', 'field'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps IntegerProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'IntModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          field: IntegerProperty({ required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, field: { type: 'integer' } },
        required: ['id', 'field'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps BooleanProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'BoolModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          field: BooleanProperty({ required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, field: { type: 'boolean' } },
        required: ['id', 'field'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps DateProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'DateModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          field: DateProperty({ required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, field: { type: 'string' } },
        required: ['id', 'field'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps DatetimeProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'DatetimeModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          field: DatetimeProperty({ required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, field: { type: 'string' } },
        required: ['id', 'field'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps EmailProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'EmailModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          field: EmailProperty({ required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, field: { type: 'string' } },
        required: ['id', 'field'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps NumberProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'NumberModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          myNumber: NumberProperty({
            required: true,
            minValue: 5,
            maxValue: 10,
          }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          myNumber: { type: 'number', minimum: 5, maximum: 10 },
        },
        required: ['id', 'myNumber'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps ObjectProperty to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'ObjectModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          field: ObjectProperty({ required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, field: { type: 'object' } },
        required: ['id', 'field'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps ModelReferenceProperty to OpenAPI schema via model', () => {
      const Ref = Model({
        pluralName: 'Refs',
        namespace: 'functional-models-orm-mcp-test',
        properties: { id: PrimaryKeyUuidProperty(), name: TextProperty({}) },
      })

      const M = Model({
        pluralName: 'RefModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          ref: ModelReferenceProperty(() => Ref, { required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: { id: { type: 'string' }, ref: { type: 'string' } },
        required: ['id', 'ref'],
      }
      assert.deepEqual(actual, expected)
    })

    it('allows nullable for non-required ObjectProperty', () => {
      const M = Model({
        pluralName: 'NullableModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          meta: ObjectProperty({}),
          requiredMeta: ObjectProperty({ required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      // Not required: should have nullable true
      assert.deepEqual(actual.properties.meta, {
        type: 'object',
        nullable: true,
      })
      // Required: should not have nullable
      assert.deepEqual(actual.properties.requiredMeta, { type: 'object' })
    })

    it('parses complex model schema with nested objects, arrays, required and optional properties', () => {
      const Ref = Model({
        pluralName: 'RefsComplex',
        namespace: 'functional-models-orm-mcp-test',
        properties: { id: PrimaryKeyUuidProperty(), name: TextProperty({}) },
      })

      const M = Model({
        pluralName: 'ComplexModels',
        namespace: 'functional-models-orm-mcp-test',
        description: 'Complex model description',
        properties: {
          id: PrimaryKeyUuidProperty(),
          title: TextProperty({ description: 'title desc', required: true }),
          counts: ArrayProperty({ zod: z.array(z.number()), required: true }),
          nestedObject: ObjectProperty({
            description: 'nested object desc',
            required: true,
            zod: z.object({
              nested: z.string().describe('inner desc'),
              optionalNested: z.number().optional(),
            }),
          }),
          ref: ModelReferenceProperty(() => Ref, { required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        description: 'Complex model description',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          title: { type: 'string', description: 'title desc' },
          counts: { type: 'array', items: { type: 'number' } },
          nestedObject: {
            type: 'object',
            description: 'nested object desc',
            properties: {
              nested: { type: 'string', description: 'inner desc' },
              optionalNested: { type: 'number' },
            },
            additionalProperties: false,
          },
          ref: { type: 'string' },
        },
        required: ['id', 'title', 'counts', 'nestedObject', 'ref'],
      }

      assert.deepEqual(actual, expected)
    })

    it('maps ZodLiteral to OpenAPI schema via model', () => {
      const M = Model({
        pluralName: 'LiteralModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          lit: TextProperty({ zod: z.literal('X'), required: true }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          lit: { enum: ['X'], type: 'string' },
        },
        required: ['id', 'lit'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps ZodEnum and ZodNativeEnum to OpenAPI schema via model', () => {
      enum NativeE {
        A = 'a',
        B = 'b',
      }

      const M = Model({
        pluralName: 'EnumModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          regular: TextProperty({ choices: Object.values(NativeE) }),
          en: TextProperty({ zod: z.enum(['ONE', 'TWO']), required: true }),
          nen: TextProperty({ zod: z.nativeEnum(NativeE) }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      const expected = {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          regular: { type: 'string', enum: ['a', 'b'] },
          en: { type: 'string', enum: ['ONE', 'TWO'] },
          nen: { type: 'string', enum: ['a', 'b'] },
        },
        required: ['id', 'en', 'nen'],
      }
      assert.deepEqual(actual, expected)
    })

    it('maps ZodUnion of string|number to string via model', () => {
      const M = Model({
        pluralName: 'UnionModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          u: TextProperty({
            zod: z.union([z.string(), z.number()]),
            required: true,
          }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      assert.deepEqual(actual.properties.u, { type: 'string' })
    })

    it('maps ZodRecord to OpenAPI additionalProperties schema', () => {
      const M = Model({
        pluralName: 'RecordModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          map: ObjectProperty({
            zod: z.record(z.string(), z.number()),
            required: true,
          }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      assert.deepEqual(actual.properties.map, {
        type: 'object',
        additionalProperties: { type: 'number' },
      })
    })

    it('maps Array of integer numbers to OpenAPI integer items', () => {
      const M = Model({
        pluralName: 'ArrayIntModels',
        namespace: 'functional-models-orm-mcp-test',
        properties: {
          id: PrimaryKeyUuidProperty(),
          arr: ArrayProperty({
            zod: z.array(z.number().int()),
            required: true,
          }),
        },
      })

      const actual = modelToOpenApi(M as any) as any
      assert.deepEqual(actual.properties.arr, {
        type: 'array',
        items: { type: 'integer' },
      })
    })
  })
})
