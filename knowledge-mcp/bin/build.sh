#!/bin/bash
set -e

# Build parent core package so we can embed it
npm --prefix .. run build

rm -Rf ./dist

# Bundle built core into local node_modules for runtime self-containment
rm -Rf ./node_modules/functional-models
mkdir -p ./node_modules/functional-models
cp -R ../dist/* ./node_modules/functional-models/

npm run tsc -- -p ./tsconfig.json
node - <<'NODE'
const fs = require('fs');
const corePkg = JSON.parse(fs.readFileSync('../package.json','utf8'));
const mcpPkg = JSON.parse(fs.readFileSync('./package.json','utf8'));
mcpPkg.version = corePkg.version;
mcpPkg.dependencies = mcpPkg.dependencies || {};
mcpPkg.dependencies['functional-models'] = corePkg.version;
fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/package.json', JSON.stringify(mcpPkg, null, 2));
NODE
cp README.md ./dist
cp -R ./bin/ ./dist/
rm ./dist/bin/build.sh

sed -i -e 's/..\/dist\//..\//g' ./dist/bin/mcp_server.js
