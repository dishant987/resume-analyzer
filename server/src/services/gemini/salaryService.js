import { generateAIContent } from './aiGateway.js'
import {
  estimateSystemPrompt,
  estimateUserPrompt,
  chatSystemPrompt,
  chatUserPrompt,
} from './prompts/salary.js'

const salaryEstimateSchema = {
  type: 'object',
  properties: {
    marketEstimates: {
      type: 'object',
      properties: {
        low: { type: 'number' },
        median: { type: 'number' },
        high: { type: 'number' },
        currency: { type: 'string' },
      },
      required: ['low', 'median', 'high', 'currency'],
    },
    negotiationStrategy: {
      type: 'object',
      properties: {
        tips: { type: 'array', items: { type: 'string' } },
        leveragePoints: { type: 'array', items: { type: 'string' } },
      },
      required: ['tips', 'leveragePoints'],
    },
  },
  required: ['marketEstimates', 'negotiationStrategy'],
}

const chatResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    coachingFeedback: { type: 'string' },
  },
  required: ['message', 'coachingFeedback'],
}

export const getSalaryEstimates = async (rawText, jobTitle, company, location) => {
  return await generateAIContent({
    prompt: `${estimateSystemPrompt}\n\n${estimateUserPrompt(rawText, jobTitle, company, location)}`,
    schema: salaryEstimateSchema,
    fallbackLabel: 'Salary Estimation',
  })
}

export const getNegotiationChatResponse = async (
  rawText,
  jobTitle,
  company,
  location,
  estimates,
  strategy,
  chatHistory
) => {
  const sysPrompt = chatSystemPrompt(rawText, jobTitle, company, location, estimates, strategy)
  const usrPrompt = chatUserPrompt(chatHistory)
  
  return await generateAIContent({
    prompt: `${sysPrompt}\n\n${usrPrompt}`,
    schema: chatResponseSchema,
    fallbackLabel: 'Negotiation Coach Response',
  })
}
