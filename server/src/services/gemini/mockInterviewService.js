import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/mockInterview.js'
import { generateInterviewQuestions } from './interviewService.js'

const feedbackSchema = {
  type: 'object',
  properties: {
    feedback: { type: 'string' },
    score: { type: 'integer', minimum: 1, maximum: 10 },
    strengths: { type: 'string' },
    improvementTip: { type: 'string' },
    sampleAnswer: { type: 'string' },
  },
  required: ['feedback', 'score', 'strengths', 'improvementTip'],
}

export const generateMockInterviewQuestions = async (rawText) => {
  return await generateInterviewQuestions(rawText)
}

export const evaluateAnswer = async (question, userAnswer, questionType) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(question, userAnswer, questionType)}`,
    schema: feedbackSchema,
    fallbackLabel: 'Mock Interview Answer Evaluation'
  })
}
