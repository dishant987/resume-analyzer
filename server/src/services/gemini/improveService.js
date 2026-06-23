import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/improve.js'

const improveSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          improved: { type: 'string' },
        },
        required: ['original', 'improved'],
      },
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          improved: { type: 'string' },
        },
        required: ['original', 'improved'],
      },
    },
    skills: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'experience', 'projects', 'skills'],
}

export const improveResume = async (rawText, issues) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(rawText, issues)}`,
    schema: improveSchema,
    fallbackLabel: 'Resume Improvement'
  })
}
