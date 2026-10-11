import { getModel } from './client.js'
import logger from '../../utils/logger.js'
import Groq from 'groq-sdk'
import { Mistral } from '@mistralai/mistralai'

// Helper to call Mistral API using official SDK
const callMistral = async (prompt, schema) => {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('Mistral API Key is not configured.')
  }

  logger.info('Gemini and Groq failed. Falling back to Mistral API...')

  const systemMessage = `You are a professional resume parsing and career development assistant. You must respond ONLY with a JSON object that strictly adheres to this JSON schema:
${JSON.stringify(schema, null, 2)}

Do not include any conversational preamble, markdown code blocks (such as \`\`\`json), or notes. Output only raw, clean, parseable JSON.`

  const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY })

  const response = await mistral.chat.complete({
    model: process.env.MISTRAL_MODEL || 'mistral-large-latest',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    responseFormat: { type: 'json_object' }
  })

  const content = response.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Mistral API returned an empty response content.')
  }

  try {
    return JSON.parse(content)
  } catch (err) {
    logger.error(`Failed to parse Mistral response JSON. Content: ${content}`)
    throw new Error('Mistral response could not be parsed as valid JSON.')
  }
}

// Helper to call Groq API using official SDK
const callGroq = async (prompt, schema) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API Key is not configured.')
  }

  logger.info('Gemini failed or rate-limited. Falling back to Groq API...')

  const systemMessage = `You are a professional resume parsing and career development assistant. You must respond ONLY with a JSON object that strictly adheres to this JSON schema:
${JSON.stringify(schema, null, 2)}

Do not include any conversational preamble, markdown code blocks (such as \`\`\`json), or notes. Output only raw, clean, parseable JSON.`

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const chatCompletion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' }
  })

  const content = chatCompletion.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq API returned an empty response content.')
  }

  try {
    return JSON.parse(content)
  } catch (err) {
    logger.error(`Failed to parse Groq response JSON. Content: ${content}`)
    throw new Error('Groq response could not be parsed as valid JSON.')
  }
}

/**
 * Main AI gateway function that attempts Gemini and falls back to Groq if rate-limited or overloaded.
 */
export const generateAIContent = async ({ prompt, schema, fallbackLabel }) => {
  try {
    // 1. Try Gemini
    const model = getModel(schema)
    const result = await model.generateContent(prompt)
    return JSON.parse(result.response.text())
  } catch (geminiErr) {
    const errorMsg = geminiErr?.message || ''
    logger.warn(`Gemini error during ${fallbackLabel}: ${errorMsg}`)

    // If Groq key is configured, fallback to Groq
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
      try {
        return await callGroq(prompt, schema)
      } catch (groqErr) {
        logger.error(`Groq failover failed for ${fallbackLabel}: ${groqErr.message}`)
        // Fall through to Mistral if available
      }
    }

    // If Mistral key is configured, fallback to Mistral
    if (process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.trim() !== '') {
      try {
        return await callMistral(prompt, schema)
      } catch (mistralErr) {
        logger.error(`Mistral failover also failed for ${fallbackLabel}: ${mistralErr.message}`)
        throw new Error('All AI services (Gemini, Groq, Mistral) are currently unavailable. Please try again in a few moments.')
      }
    }

    // No fallback keys configured - parse the Gemini error to throw a friendly message
    const isRateLimitOrOverload = 
      errorMsg.includes('429') || 
      errorMsg.includes('Quota') || 
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('503') || 
      errorMsg.includes('Service Unavailable') || 
      errorMsg.includes('overloaded')

    if (isRateLimitOrOverload) {
      throw new Error('The AI service is currently experiencing high demand or rate limits. Please try again in a few moments.')
    }
    throw geminiErr
  }
}
