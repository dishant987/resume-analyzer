import { getModel } from './client.js'
import { systemPrompt, userPrompt } from './prompts/match.js'
import { handleGeminiError } from './errorHandler.js'

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

const callGemini = async (rawText, jdText) => {
  const model = getModel(matchSchema)
  const result = await model.generateContent(
    `${systemPrompt}\n\n${userPrompt(rawText, jdText)}`
  )
  return JSON.parse(result.response.text())
}

export const matchResume = async (rawText, jdText) => {
  try {
    return await callGemini(rawText, jdText)
  } catch {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await callGemini(rawText, jdText)
    } catch (err) {
      throw handleGeminiError(err, 'JD Matching failed')
    }
  }
}
