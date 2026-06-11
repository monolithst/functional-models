import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assert } from 'chai'
import { describe, it } from 'mocha'
import {
  PrimaryKeyUuidProperty,
  Model,
  TextProperty,
} from '../../dist/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distRoot = path.resolve(__dirname, '../../dist')
const distRequire = createRequire(path.join(distRoot, 'index.js'))

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/iu

type Item = { id: string; name: string }

const createItemModel = (ModelFactory: typeof Model) =>
  ModelFactory<Item>({
    pluralName: 'Items',
    namespace: 'dist-test',
    description: 'Dist smoke test item',
    properties: {
      id: PrimaryKeyUuidProperty({ description: 'Primary key (UUID)' }),
      name: TextProperty({ required: true, description: 'Name' }),
    },
  })

describe('dist ESM import', () => {
  it('loads dist/index.js and generates a UUID primary key', async () => {
    const Items = createItemModel(Model)
    const item = Items.create<'id'>({ name: 'smoke-test' })
    const id = await item.get.id()
    assert.match(String(id), UUID_REGEX)
  })
})

describe('dist CJS require', () => {
  it('loads dist/cjs/index.cjs and generates a UUID primary key', async () => {
    const fm = distRequire('./cjs/index.cjs') as typeof import('../../dist/index.js')
    const Items = createItemModel(fm.Model)
    const item = Items.create<'id'>({ name: 'smoke-test-cjs' })
    const id = await item.get.id()
    assert.match(String(id), UUID_REGEX)
  })
})

describe('dist subpath outputs', () => {
  it('loads dist/cjs/lib.cjs', () => {
    const lib = distRequire('./cjs/lib.cjs') as typeof import('../../dist/lib.js')
    assert.isFunction(lib.parseModelName)
  })

  it('loads dist/validation.js via ESM import', async () => {
    const validation = await import('../../dist/validation.js')
    assert.isFunction(validation.isRequired)
  })
})

describe('dist package.json exports map', () => {
  it('declares dual import/require entry points', () => {
    const distPkg = JSON.parse(
      readFileSync(path.join(distRoot, 'package.json'), 'utf8')
    ) as { exports: Record<string, unknown> }
    assert.property(distPkg.exports, '.')
    assert.property(distPkg.exports, './*')
    assert.property(distPkg.exports, './orm')
    assert.equal(distPkg.type, 'module')
  })
})
