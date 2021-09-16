const assert = require('chai').assert
const { lastModifiedProperty, lastUpdatedProperty } = require('../../src/dates')

describe('/src/dates.js', () => {
  describe('#lastModifiedProperty()', () => {
    it('should return the "2021-09-16T21:51:56.039Z" when getLastModified() is called with this date', async () => {
      const date = new Date('2021-09-16T21:51:56.039Z')
      const property = lastModifiedProperty(date)
      const actual = await property.getLastModified().toISOString()
      const expected = '2021-09-16T21:51:56.039Z'
      assert.deepEqual(actual, expected)
    })
    it('should return a date for getLastModified() even if none is passed in', async () => {
      const property = lastModifiedProperty()
      const actual = await property.getLastModified().toISOString()
      assert.isOk(actual)
    })
  })
  describe('#lastUpdatedProperty()', () => {
    it('should return the "2021-09-16T21:51:56.039Z" when getLastUpdated() is called with this date', async () => {
      const date = new Date('2021-09-16T21:51:56.039Z')
      const property = lastUpdatedProperty(date)
      const actual = await property.getLastUpdated().toISOString()
      const expected = '2021-09-16T21:51:56.039Z'
      assert.deepEqual(actual, expected)
    })
    it('should return a date for getLastUpdated() even if none is passed in', async () => {
      const property = lastUpdatedProperty()
      const actual = await property.getLastUpdated().toISOString()
      assert.isOk(actual)
    })
  })
})
