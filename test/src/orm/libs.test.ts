import { assert } from 'chai'
import {
  multipleOrQuery,
  multipleAndQuery,
  queryBuilder,
  property,
  DatastoreValueType,
} from '../../../src'

describe('/src/orm/libs.ts', () => {
  describe('#multipleOrQuery()', () => {
    it('should return queryBuilder unchanged when values is empty', () => {
      const qb = queryBuilder().take(2)
      const result = multipleOrQuery(qb, 'key', [])
      assert.strictEqual(result, qb)
    })

    it('should add single property when one value', () => {
      const result = multipleOrQuery(queryBuilder(), 'name', ['a']).compile()
      assert.deepEqual(result.query, [property('name', 'a')])
    })

    it('should add property OR property when two values', () => {
      const result = multipleOrQuery(queryBuilder(), 'name', [
        'a',
        'b',
      ]).compile()
      assert.deepEqual(result.query, [
        property('name', 'a'),
        'OR',
        property('name', 'b'),
      ])
    })

    it('should add property OR property OR property when three values', () => {
      const result = multipleOrQuery(queryBuilder(), 'tag', [
        'x',
        'y',
        'z',
      ]).compile()
      assert.deepEqual(result.query, [
        property('tag', 'x'),
        'OR',
        property('tag', 'y'),
        'OR',
        property('tag', 'z'),
      ])
    })

    it('should use propertyOptions and propertyType when provided', () => {
      const result = multipleOrQuery(
        queryBuilder(),
        'count',
        [1, 2],
        DatastoreValueType.number,
        { caseSensitive: false }
      ).compile()
      assert.lengthOf(result.query, 3)
      assert.equal(
        (result.query[0] as any).valueType,
        DatastoreValueType.number
      )
    })
  })

  describe('#multipleAndQuery()', () => {
    it('should return queryBuilder unchanged when values is empty', () => {
      const qb = queryBuilder().take(2)
      const result = multipleAndQuery(qb, 'key', [])
      assert.strictEqual(result, qb)
    })

    it('should add single property when one value', () => {
      const result = multipleAndQuery(queryBuilder(), 'name', ['a']).compile()
      assert.deepEqual(result.query, [property('name', 'a')])
    })

    it('should add property AND property when two values', () => {
      const result = multipleAndQuery(queryBuilder(), 'name', [
        'a',
        'b',
      ]).compile()
      assert.deepEqual(result.query, [
        property('name', 'a'),
        'AND',
        property('name', 'b'),
      ])
    })

    it('should add property AND property AND property when three values', () => {
      const result = multipleAndQuery(queryBuilder(), 'tag', [
        'x',
        'y',
        'z',
      ]).compile()
      assert.deepEqual(result.query, [
        property('tag', 'x'),
        'AND',
        property('tag', 'y'),
        'AND',
        property('tag', 'z'),
      ])
    })

    it('should use propertyType when provided', () => {
      const result = multipleAndQuery(
        queryBuilder(),
        'count',
        [1, 2],
        DatastoreValueType.number
      ).compile()
      assert.lengthOf(result.query, 3)
      assert.equal(
        (result.query[0] as any).valueType,
        DatastoreValueType.number
      )
    })
  })
})
