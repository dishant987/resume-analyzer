import genAI, { getModel } from './client.js'
import { systemPrompt } from './prompts/analyze.js'
import { handleGeminiError } from './errorHandler.js'

const analysisSchema = {
  type: 'object',
  properties: {
    isResume: { type: 'boolean' },
    atsScore: { type: 'number' },
    summaryScore: { type: 'number' },
    skillsScore: { type: 'number' },
    experienceScore: { type: 'number' },
    projectsScore: { type: 'number' },
    grammarScore: { type: 'number' },
    summaryVerdict: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    checklist: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          passed: { type: 'boolean' },
          feedback: { type: 'string' },
        },
        required: ['label', 'passed', 'feedback'],
      },
    },
    missingSkills: { type: 'array', items: { type: 'string' } },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string' },
          problem: { type: 'string' },
          suggestion: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['section', 'problem', 'suggestion', 'severity'],
      },
    },
  },
  required: [
    'isResume', 'atsScore', 'summaryScore', 'skillsScore',
    'experienceScore', 'projectsScore', 'grammarScore',
    'summaryVerdict', 'strengths', 'checklist',
    'missingSkills', 'issues',
  ],
}

const callGemini = async (rawText) => {
  const model = getModel(analysisSchema)
  const result = await model.generateContent(`${systemPrompt}\n\n${rawText}`)
  return JSON.parse(result.response.text())
}

export const analyzeResume = async (rawText) => {
  try {
    return await callGemini(rawText)
  } catch (firstErr) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return await callGemini(rawText)
    } catch (err) {
      throw handleGeminiError(err, 'Analysis failed')
    }
  }
}

export const extractPdfTextWithGemini = async (buffer) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent([
    {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    },
    'Extract all readable text from this resume PDF. Maintain the structure and layout. Return only the extracted text without any extra chat or preamble.',
  ])
  return result.response.text()
}
