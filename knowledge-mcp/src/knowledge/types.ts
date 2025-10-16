import { NilAnnotatedFunction } from '@node-in-layers/core'
import { z } from 'zod'

export type KnowledgeServices = Readonly<object>

export type KnowledgeServicesLayer = Readonly<{
  knowledge: KnowledgeServices
}>

export type GetKnowledgeProps = Readonly<{
  // Can filter later on
}>

export type GetKnowledgeOutput = Readonly<{
  knowledge: readonly KnowledgeEntry[]
}>

export type KnowledgeEntry = Readonly<{
  id: string
  name: string
  description: string
  content: string
  tags: readonly string[]
}>

export const KnowledgeEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
})

export type KnowledgeFeatures = Readonly<{
  getKnowledgeEntries: NilAnnotatedFunction<
    GetKnowledgeProps,
    GetKnowledgeOutput
  >
}>

export type KnowledgeFeaturesLayer = Readonly<{
  knowledge: KnowledgeFeatures
}>
