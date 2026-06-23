import { getModel } from './client.js'
import { systemPrompt, userPrompt } from './prompts/interview.js'
import { handleGeminiError } from './errorHandler.js'

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

const callGemini = async (rawText) => {
  const model = getModel(interviewSchema)
  const result = await model.generateContent(
    `${systemPrompt}\n\n${userPrompt(rawText)}`
  )
  return JSON.parse(result.response.text())
}

export const generateInterviewQuestions = async (rawText) => {
  try {
    return await callGemini(rawText)
  } catch {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await callGemini(rawText)
    } catch (err) {
      throw handleGeminiError(err, 'Interview prep generation failed')
    }
  }
}
