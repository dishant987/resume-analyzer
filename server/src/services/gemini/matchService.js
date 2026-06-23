import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/match.js'

const matchSchema = {
  type: 'object',
  properties: {
    matchPercentage: { type: 'number' },
    explanation: { type: 'string' },
    missingKeywords: { type: 'array', items: { type: 'string' } },
    matchedKeywords: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } },
  },
  required: ['matchPercentage', 'explanation', 'missingKeywords', 'matchedKeywords', 'recommendations'],
}

export const matchResume = async (rawText, jdText) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(rawText, jdText)}`,
    schema: matchSchema,
    fallbackLabel: 'JD Matching'
  })
}
