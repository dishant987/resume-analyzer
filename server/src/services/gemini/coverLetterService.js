import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/coverLetter.js'

const coverLetterSchema = {
  type: 'object',
  properties: {
    coverLetter: { type: 'string' },
  },
  required: ['coverLetter'],
}

export const createCoverLetter = async (rawText, jdText) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(rawText, jdText)}`,
    schema: coverLetterSchema,
    fallbackLabel: 'Cover Letter Generation'
  })
}
