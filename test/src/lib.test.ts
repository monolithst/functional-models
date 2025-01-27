import { assert } from 'chai'
import {
  buildValidEndpoint,
  isModelInstance,
  populateApiInformation,
  noFetch,
} from '../../src/lib'
import { ApiInfo, ApiMethod } from '../../src/index'

describe('/src/lib.ts', () => {
  describe('#noFetch()', () => {
    it('should return Promise<undefined> when called', async () => {
      // @ts-ignore
      const actual = await noFetch()
      assert.isUndefined(actual)
    })
  })
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
})
