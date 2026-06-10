import { mkdirSync } from 'node:fs'
import esbuild from 'esbuild'

const entryPoints = [
  'src/index.ts',
  'src/lib.ts',
  'src/validation.ts',
  'src/models.ts',
  'src/properties.ts',
  'src/types.ts',
  'src/utils.ts',
  'src/errors.ts',
  'src/serialization.ts',
  'src/orm/index.ts',
  'src/orm/libs.ts',
  'src/orm/models.ts',
  'src/orm/properties.ts',
  'src/orm/query.ts',
  'src/orm/types.ts',
  'src/orm/validation.ts',
  'src/orm/internal-libs.ts',
]

mkdirSync('dist/cjs', { recursive: true })
mkdirSync('dist/cjs/orm', { recursive: true })

await esbuild.build({
  entryPoints,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outdir: 'dist/cjs',
  outbase: 'src',
  outExtension: { '.js': '.cjs' },
  sourcemap: true,
  external: [
    'async-lock',
    'lodash',
    'lodash/*',
    'zod',
    'modern-async',
    'openapi-types',
    'get-random-values',
  ],
})

console.info('CJS build complete:', entryPoints.length, 'entry points')
