import { assert } from 'chai'
import { getPrimaryKeyGenerator } from '../../../src/orm/internal-libs'
import { PropertyType } from '../../../src/types'

describe('/src/orm/internal-libs.ts', () => {
  describe('#getPrimaryKeyGenerator()', () => {
    it('should return a generator that resolves to a uuid when no config', async () => {
      const generator = getPrimaryKeyGenerator()
      const result = await generator(undefined as any, {} as any, {} as any)
      assert.isString(result)
      assert.match(result, /^[0-9a-f-]{36}$/i)
    })

    it('should return custom primaryKeyGenerator when provided', async () => {
      const custom = async () => 'custom-id'
      const generator = getPrimaryKeyGenerator({ primaryKeyGenerator: custom })
      const result = await generator(undefined as any, {} as any, {} as any)
      assert.equal(result, 'custom-id')
    })

    it('should return a generator that resolves to integer when dataType is Integer', async () => {
      const generator = getPrimaryKeyGenerator({
        dataType: PropertyType.Integer,
      })
      const result = await generator(undefined as any, {} as any, {} as any)
      assert.isNumber(result)
    })

    it('should use config.dataType for _getModelIdPropertyType', async () => {
      const generator = getPrimaryKeyGenerator({
        dataType: PropertyType.Text,
      })
      // Text falls through to default (uuid) in switch
      const result = await generator(undefined as any, {} as any, {} as any)
      assert.isString(result)
    })
  })
})
