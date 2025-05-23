import { assert } from 'chai'
import { describe, it } from 'mocha'

describe('/src/index.ts', () => {
  it('should load', async () => {
    const x = await import('../../src/index')
    assert.isOk(x)
  })
})
