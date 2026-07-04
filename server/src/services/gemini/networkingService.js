import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/networking.js'

const networkingSchema = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['message'],
}

export const generateNetworkingMessage = async (rawText, details) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(rawText, details)}`,
    schema: networkingSchema,
    fallbackLabel: 'Networking Message Generation'
  })
}
