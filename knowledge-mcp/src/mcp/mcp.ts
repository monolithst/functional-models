import { ServerTool } from '@l4t/mcp-ai/simple-server/types.js'
import { createSimpleServer } from '@l4t/mcp-ai/simple-server/index.js'
import {
  createMcpResponse,
  McpNamespace,
  nilAnnotatedFunctionToOpenApi,
} from '@node-in-layers/mcp-server'
import { NilAnnotatedFunction } from '@node-in-layers/core'
import { JsonObj } from 'functional-models'
import { McpMcp } from './types.js'

export const create = (): McpMcp => {
  const tools: ServerTool[] = []

  const addFeature = <TProps extends JsonObj, TOutput extends JsonObj>(
    feature: NilAnnotatedFunction<TProps, TOutput>
  ) => {
    // @ts-ignore
    const openapi = nilAnnotatedFunctionToOpenApi(feature.name, feature)
    const tool: ServerTool = {
      name: feature.functionName,
      description: openapi.description || 'MCP function',
      inputSchema: openapi.input as any,
      outputSchema: openapi.output as any,
      execute: async (input: any) => {
        const r = await feature(input)
        // @ts-ignore
        if (!r) {
          return createMcpResponse(null)
        }

        return createMcpResponse(r)
      },
    }
    tools.push(tool)
  }

  const start = async () => {
    const server = createSimpleServer({
      name: '@functional-models/knowledge-mcp',
      version: '1.0.0',
      tools,
      server: {
        connection: {
          type: 'cli',
        },
      },
    })
    await server.start()
  }

  return {
    addFeature,
    start,
  }
}
