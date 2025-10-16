import { KnowledgeFeatures, KnowledgeServices } from './knowledge/types'
import { McpServerMcpLayer } from '@node-in-layers/mcp-server'
import { McpMcpLayer } from './mcp/types.js'

export type System = Readonly<{
  services: KnowledgeServices
  features: KnowledgeFeatures
  mcp: McpServerMcpLayer & McpMcpLayer
}>
