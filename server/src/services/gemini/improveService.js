import { getModel } from './client.js'
import { systemPrompt, userPrompt } from './prompts/improve.js'
import { handleGeminiError } from './errorHandler.js'

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

const callGemini = async (rawText, issues) => {
  const model = getModel(improveSchema)
  const result = await model.generateContent(
    `${systemPrompt}\n\n${userPrompt(rawText, issues)}`
  )
  return JSON.parse(result.response.text())
}

export const improveResume = async (rawText, issues) => {
  try {
    return await callGemini(rawText, issues)
  } catch (firstErr) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await callGemini(rawText, issues)
    } catch (err) {
      throw handleGeminiError(err, 'Improvement failed')
    }
  }
}
