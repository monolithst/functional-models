import { assert } from 'chai'
import {
  buildValidEndpoint,
  isModelInstance,
  populateApiInformation,
  createZodForProperty,
} from '../../src/lib'
import { ApiInfo, ApiMethod } from '../../src/index'
import z from 'zod'

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
})
