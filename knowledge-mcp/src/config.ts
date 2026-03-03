import { CoreNamespace, LogFormat, LogLevelNames } from '@node-in-layers/core'
import { McpNamespace } from '@node-in-layers/mcp-server'

export default async () => {
  return {
    environment: 'prod',
    systemName: '@node-in-layers/core/knowledge-mcp',
    [CoreNamespace.root]: {
      // @ts-ignore
      apps: await Promise.all([
        import(`@node-in-layers/mcp-server/index.js`),
        import('./mcp/index.js'),
        import('./knowledge/index.js'),
      ]),
      layerOrder: ['services', 'features', ['entries', 'mcp']],
      logging: {
        logLevel: LogLevelNames.trace,
        logFormat: LogFormat.json,
        // @ts-ignore
        //customLogger: createCustomLogger(),
        ignoreLayerFunctions: {
          'amplify:services:getActiveGrowthAds': true,
          'mongo.services.getMongoCollection': true,
          'logs.features.searchRequests': true,
          'auth.features': true,
          'logging.services': true,
          'logging.features': true,
          'deepHelixAuth.services': true,
          'deepHelixAuth.features.authMiddleware': true,
          'mcp.mcp.addTool': true,
          'mcp.mcp.addUnprotectedRoute': true,
          'mcp.mcp.start': true,
          'mcp.mcp.addFeature': true,
          '@node-in-layers/data.express': true,
          '@node-in-layers/data.services': true,
          '@node-in-layers/data.features': true,
          '@node-in-layers/rest-api/express.express': true,
          '@node-in-layers/rest-api/express.features': true,
          '@node-in-layers/rest-api/express.services': true,
          '@node-in-layers/mcp-server.mcp': true,
          'azure.services.discoverAzureStorageAccountAndKey': true,
          'tasks.features.runFeatureTask': true,
          'azure.express': true,
          'api.express': true,
        },
      },
    },
    [McpNamespace]: {
      server: {
        connection: {
          // @ts-ignore
          type: 'cli',
        },
      },
    },
  }
}
