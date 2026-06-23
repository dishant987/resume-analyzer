import { generateAIContent } from './aiGateway.js'
import { systemPrompt } from './prompts/analyze.js'

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

export const analyzeResume = async (rawText) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${rawText}`,
    schema: analysisSchema,
    fallbackLabel: 'Resume Analysis'
  })
}


