import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const pkgPath = path.join(rootDir, 'package.json')
const distPkgPath = path.join(rootDir, 'dist', 'package.json')

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

const distPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  type: 'module',
  main: 'index.js',
  types: 'index.d.ts',
  exports: {
    '.': {
      import: {
        types: './index.d.ts',
        default: './index.js',
      },
      require: {
        types: './index.d.ts',
        default: './cjs/index.cjs',
      },
    },
    './orm': {
      import: {
        types: './orm/index.d.ts',
        default: './orm/index.js',
      },
      require: {
        types: './orm/index.d.ts',
        default: './cjs/orm/index.cjs',
      },
    },
    './orm/*': {
      import: {
        types: './orm/*.d.ts',
        default: './orm/*.js',
      },
      require: {
        types: './orm/*.d.ts',
        default: './cjs/orm/*.cjs',
      },
    },
    './*': {
      import: {
        types: './*.d.ts',
        default: './*.js',
      },
      require: {
        types: './*.d.ts',
        default: './cjs/*.cjs',
      },
    },
    './package.json': './package.json',
  },
  keywords: pkg.keywords,
  publishConfig: pkg.publishConfig,
  author: pkg.author,
  license: pkg.license,
  repository: pkg.repository,
  bugs: pkg.bugs,
  homepage: pkg.homepage,
  dependencies: pkg.dependencies,
}

writeFileSync(distPkgPath, `${JSON.stringify(distPkg, null, 2)}\n`)
console.info('Wrote dist/package.json with exports map')
