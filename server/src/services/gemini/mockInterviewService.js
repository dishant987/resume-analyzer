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

const recommendationSchema = {
  type: 'object',
  properties: {
    recommendedCategory: { type: 'string', enum: ['technical', 'hr'] },
    recommendedLanguage: { type: 'string', enum: ['javascript', 'python', 'java', 'cpp'] },
    recommendedDurationMinutes: { type: 'integer', minimum: 5, maximum: 60 },
    targetRole: { type: 'string' },
    rationale: { type: 'string' },
    suggestedFocusAreas: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['recommendedCategory', 'recommendedLanguage', 'recommendedDurationMinutes', 'targetRole', 'rationale']
}

const customQuestionsSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          type: { type: 'string', enum: ['technical', 'behavioral', 'coding'] },
          suggestedAnswer: { type: 'string' },
          tips: { type: 'string' },
          starterCode: { type: 'string' },
          testCases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                input: { type: 'string' },
                expectedOutput: { type: 'string' },
                description: { type: 'string' },
                isHidden: { type: 'boolean' }
              },
              required: ['input', 'expectedOutput', 'description']
            }
          }
        },
        required: ['question', 'type']
      }
    }
  },
  required: ['questions']
}

const finalReportSchema = {
  type: 'object',
  properties: {
    overallScore: { type: 'integer', minimum: 0, maximum: 100 },
    technicalScore: { type: 'integer', minimum: 0, maximum: 100 },
    communicationScore: { type: 'integer', minimum: 0, maximum: 100 },
    problemSolvingScore: { type: 'integer', minimum: 0, maximum: 100 },
    codeQualityScore: { type: 'integer', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    strengths: {
      type: 'array',
      items: { type: 'string' }
    },
    improvements: {
      type: 'array',
      items: { type: 'string' }
    },
    actionableAdvice: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['overallScore', 'technicalScore', 'communicationScore', 'problemSolvingScore', 'codeQualityScore', 'summary', 'strengths', 'improvements', 'actionableAdvice']
}

export const generateMockInterviewQuestions = async (rawText) => {
  return await generateInterviewQuestions(rawText)
}

export const generateAIInterviewRecommendation = async (resumeText) => {
  const prompt = `You are an AI Hiring Manager and Tech Recruiter.
Analyze the candidate's resume text below and recommend the best mock interview setup.

RESUME CONTENT:
${resumeText.slice(0, 3000)}

Determine:
1. "recommendedCategory": 'technical' (if tech skills, programming, engineering exist) or 'hr' (if general management/non-tech).
2. "recommendedLanguage": Best programming language for their background among ['javascript', 'python', 'java', 'cpp']. Defaults to 'javascript' or 'python' if ambiguous.
3. "recommendedDurationMinutes": Suggested session time (e.g., 10, 15, 20, 30).
4. "targetRole": High accuracy candidate job title detected from resume (e.g. Senior Full Stack Engineer, React Developer, Data Analyst).
5. "rationale": Short 2-sentence explanation why this setup fits the resume.
6. "suggestedFocusAreas": Array of 3-4 key technical or behavioral skill areas to test.`

  return await generateAIContent({
    prompt,
    schema: recommendationSchema,
    fallbackLabel: 'AI Interview Recommendation'
  })
}

export const generateCustomInterviewQuestions = async ({ resumeText, category = 'technical', selectedLanguage = 'javascript', durationMinutes = 15, targetRole = 'Software Engineer' }) => {
  const isTechnical = category === 'technical' || category === 'ai_suggested'
  const isHR = category === 'hr'

  const prompt = `You are a Senior Technical Lead and HR Recruiter conducting a live mock interview for position: "${targetRole}".

Candidate Resume Context:
${resumeText.slice(0, 2500)}

Interview Settings:
- Category: ${category.toUpperCase()}
- Primary Language (if technical): ${selectedLanguage.toUpperCase()}
- Session Duration: ${durationMinutes} minutes

Requirements:
1. Generate 3 to 5 realistic interview questions appropriate for a ${durationMinutes}-minute session.
2. If Category is TECHNICAL:
   - Include 2 conceptual technical questions AND at least 1-2 practical coding challenges.
   - For coding challenges, set "type" to "coding".
   - Provide clean "starterCode" boilerplate in ${selectedLanguage} (e.g. function signature with comments).
   - Provide 3 structured "testCases" with "input", "expectedOutput", and "description".
3. If Category is HR / Behavioral:
   - Provide realistic HR/Behavioral questions (STAR method focus). Set "type" to "behavioral".
4. Provide suggested answers and helpful tips for each question.`

  return await generateAIContent({
    prompt,
    schema: customQuestionsSchema,
    fallbackLabel: 'Custom Interview Questions Generator'
  })
}

export const evaluateAnswer = async (question, userAnswer, questionType) => {
  return await generateAIContent({
    prompt: `${systemPrompt}\n\n${userPrompt(question, userAnswer, questionType)}`,
    schema: feedbackSchema,
    fallbackLabel: 'Mock Interview Answer Evaluation'
  })
}

export const generateFinalInterviewReport = async (sessionData) => {
  const prompt = `You are an Executive Tech Interview Assessor.
Review the candidate's completed mock interview session details and generate a comprehensive performance analysis report.

Session Metadata:
- Category: ${sessionData.category}
- Programming Language: ${sessionData.selectedLanguage}
- Target Role: ${sessionData.targetRole}
- Average Question Score: ${sessionData.averageScore} / 10

Questions & Answer History:
${JSON.stringify(sessionData.chatHistory, null, 2)}

Scores & Evaluations:
${JSON.stringify(sessionData.scores, null, 2)}

Coding Submissions & Test Case Results:
${JSON.stringify(sessionData.codingSubmissions, null, 2)}

Requirements:
Generate realistic score percentages (0-100) for:
- overallScore
- technicalScore
- communicationScore
- problemSolvingScore
- codeQualityScore
Also provide:
- summary: A comprehensive executive summary of candidate's performance.
- strengths: Array of 3-4 specific candidate highlights.
- improvements: Array of 3-4 specific areas needing work.
- actionableAdvice: Array of 3 key actionable preparation tips.`

  return await generateAIContent({
    prompt,
    schema: finalReportSchema,
    fallbackLabel: 'Final Interview Performance Report'
  })
}
