import { generateAIContent } from './aiGateway.js'
import { systemPrompt, userPrompt } from './prompts/career.js'

const careerSchema = {
  type: 'object',
  properties: {
    matchPercentage: { type: 'number' },
    missingSkills: { type: 'array', items: { type: 'string' } },
    gainedSkills: { type: 'array', items: { type: 'string' } },
    roadmap: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phase: { type: 'string' },
          duration: { type: 'string' },
          focus: { type: 'string' },
          tasks: { type: 'array', items: { type: 'string' } },
          projects: { type: 'array', items: { type: 'string' } },
          resources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                url: { type: 'string' }
              },
              required: ['label', 'url']
            }
          },
        },
        required: ['phase', 'duration', 'focus', 'tasks', 'projects', 'resources'],
      },
    },
  },
  required: ['matchPercentage', 'missingSkills', 'gainedSkills', 'roadmap'],
}

export const generateCareerRoadmap = async (rawText, targetRole) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(rawText, targetRole)}`,
    schema: careerSchema,
    fallbackLabel: 'Career Roadmap & Skill Gap Analysis',
  })
}
