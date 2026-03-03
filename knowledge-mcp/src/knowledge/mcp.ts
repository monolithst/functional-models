import { Config } from '@node-in-layers/core'
import { McpContext } from '@node-in-layers/mcp-server'
import { McpMcpLayer } from '../mcp/types'
import { KnowledgeFeaturesLayer } from './types'

export const create = (
  context: McpContext<Config, KnowledgeFeaturesLayer, McpMcpLayer>
) => {
  context.mcp.mcp.addFeature(context.features.knowledge.getKnowledgeEntries)
  return {}
}
