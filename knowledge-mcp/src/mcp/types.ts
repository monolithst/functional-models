import { NilAnnotatedFunction } from '@node-in-layers/core'
import { JsonObj } from 'functional-models'

export type McpServices = Readonly<object>

export type McpServicesLayer = Readonly<{
  mcp: McpServices
}>

export type McpFeatures = Readonly<object>

export type McpFeaturesLayer = Readonly<{
  mcp: McpFeatures
}>

export type McpMcp = Readonly<{
  addFeature: <TProps extends JsonObj, TOutput extends JsonObj>(
    feature: NilAnnotatedFunction<TProps, TOutput>
  ) => void
  start: () => Promise<void>
}>

export type McpMcpLayer = Readonly<{
  mcp: McpMcp
}>
