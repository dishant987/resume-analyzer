import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/linkedin.js'

const linkedinSchema = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    about: { type: 'string' },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          company: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    skills: {
      type: 'array',
      items: { type: 'string' },
    },
    recommendations: { type: 'string' },
  },
  required: ['headline', 'about', 'experience', 'skills'],
}

export const generateLinkedInProfile = async (rawText) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(rawText)}`,
    schema: linkedinSchema,
    fallbackLabel: 'LinkedIn Profile Generation'
  })
}
