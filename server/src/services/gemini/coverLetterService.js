import { getModel } from './client.js'
import { systemPrompt, userPrompt } from './prompts/coverLetter.js'
import { handleGeminiError } from './errorHandler.js'

const coverLetterSchema = {
  type: 'object',
  properties: {
    coverLetter: { type: 'string' },
  },
  required: ['coverLetter'],
}

const callGemini = async (rawText, jdText) => {
  const model = getModel(coverLetterSchema)
  const result = await model.generateContent(
    `${systemPrompt}\n\n${userPrompt(rawText, jdText)}`
  )
  return JSON.parse(result.response.text())
}

export const createCoverLetter = async (rawText, jdText) => {
  try {
    return await callGemini(rawText, jdText)
  } catch {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await callGemini(rawText, jdText)
    } catch (err) {
      throw handleGeminiError(err, 'Cover Letter generation failed')
    }
  }
}
