import {
  Config,
  FeaturesContext,
  annotatedFunction,
} from '@node-in-layers/core'
import {
  KnowledgeServicesLayer,
  KnowledgeFeaturesLayer,
  GetKnowledgeProps,
  GetKnowledgeOutput,
  KnowledgeEntrySchema,
  KnowledgeFeatures,
} from './types.js'
import { z } from 'zod'
import entries from './entries.json' with { type: 'json' }

export const create = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: FeaturesContext<
    Config,
    KnowledgeServicesLayer,
    KnowledgeFeaturesLayer
  >
): KnowledgeFeatures => {
  const getKnowledgeEntries = annotatedFunction<
    GetKnowledgeProps,
    GetKnowledgeOutput
  >(
    {
      functionName: 'getKnowledgeEntries',
      domain: 'knowledge',
      description: 'Explains how to use the functional-models library.',
      args: z.object({}),
      returns: z.object({
        knowledge: z.array(KnowledgeEntrySchema),
      }),
    },
    () => Promise.resolve({
      knowledge: entries,
    })
  )

  return {
    getKnowledgeEntries,
  }
}
