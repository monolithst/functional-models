import { assert } from 'chai'
import {
  and,
  DatastoreValueType,
  datesAfter,
  datesBefore,
  EqualitySymbol,
  isALinkToken,
  isPropertyBasedQuery,
  numberQuery,
  or,
  pagination,
  property,
  queryBuilder,
  sort,
  SortOrder,
  take,
  textQuery,
  booleanQuery,
  threeitize,
} from '../../../src'

describe('/src/orm/query.ts', () => {
  describe('#threeitize()', () => {
    it('should throw an exception if there are 4 values', () => {
      assert.throws(() => {
        threeitize(['a', 'b', 'c', 'd'])
      }, 'Must be an odd number of 3 or greater')
    })
    it('should allow 5 values', () => {
      const actual = threeitize(['a', 'b', 'c', 'd', 'e'])
      const expected = [
        ['a', 'b', 'c'],
        ['c', 'd', 'e'],
      ]
      assert.deepEqual(actual, expected)
    })
    it('should throw an exception if there are 6 values', () => {
      assert.throws(() => {
        threeitize(['a', 'b', 'c', 'd', 'e', 'f'])
      }, 'Must be an odd number of 3 or greater')
    })
    it('should throw an exception if there are 8 values', () => {
      assert.throws(() => {
        threeitize(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
      }, 'Must be an odd number of 3 or greater')
    })
    it('should create the expected structure by walking down and grouping', () => {
      const actual = threeitize(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'])
      const expected = [
        ['a', 'b', 'c'],
        ['c', 'd', 'e'],
        ['e', 'f', 'g'],
        ['g', 'h', 'i'],
      ]
      assert.deepEqual(actual, expected)
    })
  })
  describe('#booleanQuery()', () => {
    it('should create an expected boolean property query', () => {
      const actual = booleanQuery('my-key', false)
      const expected = {
        type: 'property',
        key: 'my-key',
        value: false,
        equalitySymbol: '=',
        options: {},
        valueType: 'boolean',
      }
      assert.deepStrictEqual(actual, expected)
    })
  })
  describe('#numberQuery()', () => {
    it('should create an expected number property query', () => {
      const actual = numberQuery('my-key', 5)
      const expected = {
        type: 'property',
        key: 'my-key',
        value: 5,
        equalitySymbol: '=',
        options: {},
        valueType: 'number',
      }
      assert.deepStrictEqual(actual, expected)
    })
    it('should create an expected number property query with equality', () => {
      const actual = numberQuery('my-key', 5, EqualitySymbol.gt)
      const expected = {
        type: 'property',
        key: 'my-key',
        value: 5,
        equalitySymbol: '>',
        options: {},
        valueType: 'number',
      }
      assert.deepStrictEqual(actual, expected)
    })
  })
  describe('#textQuery()', () => {
    it('should create an expected text property query', () => {
      const actual = textQuery('my-key', 'my-value')
      const expected = {
        type: 'property',
        key: 'my-key',
        value: 'my-value',
        equalitySymbol: '=',
        options: {},
        valueType: 'string',
      }
      assert.deepEqual(actual, expected)
    })
    it('should create an expected text property query with options', () => {
      const actual = textQuery('my-key', 'my-value', { caseSensitive: true })
      const expected = {
        type: 'property',
        key: 'my-key',
        value: 'my-value',
        equalitySymbol: '=',
        options: {
          caseSensitive: true,
        },
        valueType: 'string',
      }
      assert.deepEqual(actual, expected)
    })
  })
  describe('#isOrmValueStatement()', () => {
    it('should return true if it is a property', () => {
      const actual = isPropertyBasedQuery({ type: 'property' })
      assert.isTrue(actual)
    })
    it('should return true if it is a datesBefore', () => {
      const actual = isPropertyBasedQuery({ type: 'datesBefore' })
      assert.isTrue(actual)
    })
    it('should return true if it is a datesAfter', () => {
      const actual = isPropertyBasedQuery({ type: 'datesAfter' })
      assert.isTrue(actual)
    })
    it('should return false if it is a anything', () => {
      const actual = isPropertyBasedQuery('anything')
      assert.isFalse(actual)
    })
    it('should return false if it is undefined', () => {
      const actual = isPropertyBasedQuery(undefined)
      assert.isFalse(actual)
    })
  })
  describe('#isBooleanType()', () => {
    it('should return true if value is and', () => {
      const actual = isALinkToken('and')
      assert.isTrue(actual)
    })
    it('should return true if value is AND', () => {
      const actual = isALinkToken('AND')
      assert.isTrue(actual)
    })
    it('should return true if value is or', () => {
      const actual = isALinkToken('or')
      assert.isTrue(actual)
    })
    it('should return true if value is OR', () => {
      const actual = isALinkToken('OR')
      assert.isTrue(actual)
    })
    it('should return false if value is anything', () => {
      const actual = isALinkToken('anything')
      assert.isFalse(actual)
    })
    it('should return false if value is undefined', () => {
      const actual = isALinkToken(undefined)
      assert.isFalse(actual)
    })
  })
  describe('#take()', () => {
    it('should pass through a number', () => {
      const actual = take(1)
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should take the integer part of a float', () => {
      const actual = take(1.123)
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should throw an exception if the number is a float', () => {
      assert.throws(() => {
        // @ts-ignore
        const actual = take('hello world')
      }, 'Number "hello world" is not integerable')
    })
  })
  describe('#pagination()', () => {
    it('should return any value passed in', () => {
      const actual = pagination('anything')
      const expected = 'anything'
      assert.equal(actual, expected)
    })
  })
  describe('#sort()', () => {
    it('should throw an exception if order is a boolean', () => {
      assert.throws(() => {
        // @ts-ignore
        sort('my-key', false)
      }, 'Sort must be either asc or dsc')
    })
    it('should return the key and order passed in', () => {
      const actual = sort('my-key', SortOrder.dsc)
      const expected = {
        key: 'my-key',
        order: 'dsc',
      }
      assert.deepEqual(actual, expected)
    })
    it('should return order:asc even if order isnt passed', () => {
      const actual = sort('my-key')
      const expected = {
        key: 'my-key',
        order: 'asc',
      }
      assert.deepEqual(actual, expected)
    })
  })
  describe('#property()', () => {
    it('should not add missing options if not provided', () => {
      const actual = property('my-name', 'my-value', {
        caseSensitive: true,
      })
      const expected = {
        type: 'property',
        key: 'my-name',
        value: 'my-value',
        valueType: DatastoreValueType.string,
        equalitySymbol: EqualitySymbol.eq,
        options: {
          caseSensitive: true,
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create a well formatted property', () => {
      const actual = property('my-name', 'my-value', {
        caseSensitive: true,
        endsWith: false,
        type: DatastoreValueType.date,
        equalitySymbol: EqualitySymbol.eq,
        startsWith: true,
      })
      const expected = {
        type: 'property',
        key: 'my-name',
        value: 'my-value',
        valueType: DatastoreValueType.date,
        equalitySymbol: EqualitySymbol.eq,
        options: {
          caseSensitive: true,
          startsWith: true,
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should throw an exception if the type is string and equalitySymbol is gt', () => {
      assert.throws(() => {
        property('my-name', 'my-value', {
          equalitySymbol: EqualitySymbol.gt,
        })
      }, 'Cannot use a non = symbol for a string type')
    })
    it('should throw an exception if the type is string and equalitySymbol is lte', () => {
      assert.throws(() => {
        property('my-name', 'my-value', {
          equalitySymbol: EqualitySymbol.lte,
        })
      }, 'Cannot use a non = symbol for a string type')
    })
    it('should throw an exception EqualitySymbol is blah', () => {
      assert.throws(() => {
        property('my-name', 'my-value', {
          // @ts-ignore
          equalitySymbol: 'blah',
        })
      }, 'blah is not a valid symbol')
    })
  })
  describe('#and()', () => {
    it('should return AND', () => {
      const actual = and()
      const expected = 'AND'
      assert.equal(actual, expected)
    })
  })
  describe('#or()', () => {
    it('should return OR', () => {
      const actual = or()
      const expected = 'OR'
      assert.equal(actual, expected)
    })
  })
  describe('#datesBefore()', () => {
    it('should create an expected datesBefore statement with no options passed in', () => {
      const actual = datesBefore('my-key', '2025-01-01T00:00:00.000Z')
      const expected = {
        type: 'datesBefore',
        key: 'my-key',
        date: '2025-01-01T00:00:00.000Z',
        valueType: DatastoreValueType.string,
        options: {
          equalToAndBefore: true,
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create an expected datesBefore statement with a string date', () => {
      const actual = datesBefore('my-key', '2025-01-01T00:00:00.000Z', {
        valueType: DatastoreValueType.date,
        equalToAndBefore: true,
      })
      const expected = {
        type: 'datesBefore',
        key: 'my-key',
        date: '2025-01-01T00:00:00.000Z',
        valueType: DatastoreValueType.date,
        options: {
          equalToAndBefore: true,
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create an expected datesBefore statement with a Date() object', () => {
      const actual = datesBefore(
        'my-key',
        new Date('2025-01-01T00:00:00.000Z'),
        {
          valueType: DatastoreValueType.string,
          equalToAndBefore: false,
        }
      )
      const expected = {
        type: 'datesBefore',
        key: 'my-key',
        date: '2025-01-01T00:00:00.000Z',
        valueType: DatastoreValueType.string,
        options: {
          equalToAndBefore: false,
        },
      }
      assert.deepEqual(actual, expected)
    })
  })
  describe('#datesAfter()', () => {
    it('should create an expected datesAfter statement with no options passed in', () => {
      const actual = datesAfter('my-key', '2025-01-01T00:00:00.000Z')
      const expected = {
        type: 'datesAfter',
        key: 'my-key',
        date: '2025-01-01T00:00:00.000Z',
        valueType: DatastoreValueType.string,
        options: {
          equalToAndAfter: true,
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create an expected datesAfter statement with a string date', () => {
      const actual = datesAfter('my-key', '2025-01-01T00:00:00.000Z', {
        valueType: DatastoreValueType.date,
        equalToAndAfter: true,
      })
      const expected = {
        type: 'datesAfter',
        key: 'my-key',
        date: '2025-01-01T00:00:00.000Z',
        valueType: DatastoreValueType.date,
        options: {
          equalToAndAfter: true,
        },
      }
      assert.deepEqual(actual, expected)
    })
    it('should create an expected datesAfter statement with a Date() object', () => {
      const actual = datesAfter(
        'my-key',
        new Date('2025-01-01T00:00:00.000Z'),
        {
          valueType: DatastoreValueType.string,
          equalToAndAfter: false,
        }
      )
      const expected = {
        type: 'datesAfter',
        key: 'my-key',
        date: '2025-01-01T00:00:00.000Z',
        valueType: DatastoreValueType.string,
        options: {
          equalToAndAfter: false,
        },
      }
      assert.deepEqual(actual, expected)
    })
  })
  describe('#builderV2()', () => {
    describe('after calling property()', () => {
      it('should create an object that has and, or, compile, take, sort, pagination', () => {
        const actual = Object.keys(
          queryBuilder().property('my-key', 'my-value')
        ).sort()
        const expected = [
          'and',
          'or',
          'compile',
          'take',
          'sort',
          'pagination',
        ].sort()
        assert.deepEqual(actual, expected)
      })
      describe('#and()', () => {
        it('should create a query with two properties when property is called after', () => {
          const actual = queryBuilder()
            .property('my-key', 'my-value')
            .and()
            .property('my-key2', 'my-value2')
            .compile().query
          const expected = [
            property('my-key', 'my-value'),
            'AND',
            property('my-key2', 'my-value2'),
          ]
          assert.deepEqual(actual, expected)
        })
      })
      describe('#or()', () => {
        it('should create a query with two properties when property is called after', () => {
          const actual = queryBuilder()
            .property('my-key', 'my-value')
            .or()
            .property('my-key2', 'my-value2')
            .compile().query
          const expected = [
            property('my-key', 'my-value'),
            'OR',
            property('my-key2', 'my-value2'),
          ]
          assert.deepEqual(actual, expected)
        })
      })
    })
    it('should create an object that has take, sort, pagination, compile, complex, property, datesBefore, datesAfter', () => {
      const actual = Object.keys(queryBuilder()).sort()
      const expected = [
        'take',
        'sort',
        'pagination',
        'compile',
        'complex',
        'property',
        'datesBefore',
        'datesAfter',
      ].sort()
      assert.deepEqual(actual, expected)
    })
    describe('#compile()', () => {
      it('should create an array when nothing is passed in', () => {
        const actual = queryBuilder().compile()
        const expected = { query: [] }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#take()', () => {
      it('should create the expected end take value after compile', () => {
        const actual = queryBuilder().take(1).compile()
        const expected = {
          query: [],
          take: 1,
        }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#sort()', () => {
      it('should create the expected end sort value after compile', () => {
        const actual = queryBuilder().sort('my-key', SortOrder.dsc).compile()
        const expected = {
          query: [],
          sort: {
            key: 'my-key',
            order: SortOrder.dsc,
          },
        }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#pagination()', () => {
      it('should create the expected end page value after compile', () => {
        const actual = queryBuilder().pagination('anything-it-needs').compile()
        const expected = {
          query: [],
          page: 'anything-it-needs',
        }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#complex()', () => {
      it('should create an expected object, with the most complex queries ever', () => {
        const actual = queryBuilder()
          .sort('my-sort-key', SortOrder.dsc)
          .take(1)
          .pagination('my-page')
          .complex(x =>
            x
              .property('my-key', 'my-value')
              .or()
              .property('my-key-2', 'my-value-2')
              .compile()
          )
          .and()
          .complex(x =>
            x
              .property('key1', 'v1')
              .and()
              .complex(y =>
                y
                  .property('nested', 'in-here')
                  .and()
                  .property('another-2', 'value-2')
              )
          )
          .compile()
        const expected = {
          page: 'my-page',
          query: [
            [
              property('my-key', 'my-value'),
              'OR',
              property('my-key-2', 'my-value-2'),
            ],
            'AND',
            [
              property('key1', 'v1'),
              'AND',
              [
                property('nested', 'in-here'),
                'AND',
                property('another-2', 'value-2'),
              ],
            ],
          ],
          take: 1,
          sort: {
            key: 'my-sort-key',
            order: SortOrder.dsc,
          },
        }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#property()', () => {
      it('should create a property inside of query after compile', () => {
        const actual = queryBuilder({}).property('my-key', 'my-value').compile()
        const expected = {
          query: [
            {
              type: 'property',
              key: 'my-key',
              value: 'my-value',
              valueType: DatastoreValueType.string,
              options: {},
              equalitySymbol: EqualitySymbol.eq,
            },
          ],
        }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#datesBefore()', () => {
      it('should create a datesBefore inside of query after compile', () => {
        const actual = queryBuilder({})
          .datesBefore('my-key', '2020-01-01')
          .compile()
        const expected = {
          query: [
            {
              type: 'datesBefore',
              key: 'my-key',
              date: '2020-01-01',
              valueType: 'string',
              options: {
                equalToAndBefore: true,
              },
            },
          ],
        }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#datesAfter()', () => {
      it('should create a datesAfter inside of query after compile', () => {
        const actual = queryBuilder({})
          .datesAfter('my-key', '2020-01-01')
          .compile()
        const expected = {
          query: [
            {
              type: 'datesAfter',
              key: 'my-key',
              date: '2020-01-01',
              valueType: 'string',
              options: {
                equalToAndAfter: true,
              },
            },
          ],
        }
        assert.deepEqual(actual, expected)
      })
    })
  })
})
