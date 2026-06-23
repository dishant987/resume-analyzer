import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/interview.js'

const interviewSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          type: { type: 'string', enum: ['technical', 'behavioral'] },
          suggestedAnswer: { type: 'string' },
          tips: { type: 'string' },
        },
        required: ['question', 'type', 'suggestedAnswer', 'tips'],
      },
    },
  },
  required: ['questions'],
}

export const generateInterviewQuestions = async (rawText) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(rawText)}`,
    schema: interviewSchema,
    fallbackLabel: 'Interview Prep Generation'
  })
}
