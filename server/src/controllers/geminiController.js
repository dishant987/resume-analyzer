import Resume from '../models/Resume.js'
import Analysis from '../models/Analysis.js'
import ResumeVersion from '../models/ResumeVersion.js'
import JobMatch from '../models/JobMatch.js'
import CoverLetter from '../models/CoverLetter.js'
import InterviewPrep from '../models/InterviewPrep.js'
import CareerRoadmap from '../models/CareerRoadmap.js'
import SalaryNegotiation from '../models/SalaryNegotiation.js'
import NetworkingMessage from '../models/NetworkingMessage.js'
import MockInterviewSession from '../models/MockInterviewSession.js'
import JobApplication from '../models/JobApplication.js'
import LinkedInProfile from '../models/LinkedInProfile.js'
import { analyzeResume } from '../services/gemini/analyzeService.js'
import { improveResume } from '../services/gemini/improveService.js'
import { matchResume } from '../services/gemini/matchService.js'
import { createCoverLetter } from '../services/gemini/coverLetterService.js'
import { generateInterviewQuestions } from '../services/gemini/interviewService.js'
import { generateCareerRoadmap } from '../services/gemini/careerService.js'
import { getSalaryEstimates, getNegotiationChatResponse } from '../services/gemini/salaryService.js'
import { generateNetworkingMessage } from '../services/gemini/networkingService.js'
import { generateMockInterviewQuestions, evaluateAnswer } from '../services/gemini/mockInterviewService.js'
import { generateLinkedInProfile } from '../services/gemini/linkedinService.js'

export const analyzeResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }

    const analysisData = await analyzeResume(resume.rawText)

    if (analysisData.isResume === false) {  
      resume.status = 'failed'
      await resume.save()
      return res.status(400).json({
        message: 'The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume file.'
      })
    }

    const analysis = await Analysis.create({
      resumeId: resume._id,
      ...analysisData,
    })

    resume.status = 'analyzed'
    await resume.save()

    res.json({ analysis })
  } catch (err) {
    next(err)
  }
}

export const improveResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const analysis = await Analysis.findOne({ resumeId: resume._id }).sort({ createdAt: -1 })
    if (!analysis) {
      return res.status(400).json({ message: 'Analyze the resume first before improving' })
    }

    const improvementData = await improveResume(resume.rawText, analysis.issues)

    const lastVersion = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 })
    const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1

    const content = {
      summary: improvementData.summary,
      experience: improvementData.experience.map((e) => e.improved).join('\n\n'),
      projects: improvementData.projects.map((p) => p.improved).join('\n\n'),
      skills: improvementData.skills.join(', '),
      education: '',
    }

    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber,
      source: 'ai_generated',
      content,
    })

    resume.status = 'improved'
    await resume.save()

    res.json({ version, improvement: improvementData })
  } catch (err) {
    next(err)
  }
}

export const getAnalysis = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const analysis = await Analysis.findOne({ resumeId: resume._id }).sort({ createdAt: -1 })
    res.json({ analysis })
  } catch (err) {
    next(err)
  }
}

export const getVersions = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const versions = await ResumeVersion.find({ resumeId: resume._id }).sort({ versionNumber: -1 })
    res.json({ versions })
  } catch (err) {
    next(err)
  }
}

export const saveVersion = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    const { content, source } = req.body
    const lastVersion = await ResumeVersion.findOne({ resumeId: resume._id }).sort({ versionNumber: -1 })
    const version = await ResumeVersion.create({
      resumeId: resume._id,
      versionNumber: lastVersion ? lastVersion.versionNumber + 1 : 1,
      source: source || 'user_edited',
      content,
      parentVersionId: lastVersion?._id || null,
    })
    res.status(201).json({ version })
  } catch (err) {
    next(err)
  }
}

export const matchResumeToJd = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }
    const { jd } = req.body
    if (!jd || !jd.trim()) {
      return res.status(400).json({ message: 'Job Description is required' })
    }

    const matchData = await matchResume(resume.rawText, jd)
    
    // Save to Database
    const jobMatch = await JobMatch.create({
      resumeId: resume._id,
      userId: req.user._id,
      jd,
      ...matchData
    })

    res.json({ match: jobMatch })
  } catch (err) {
    next(err)
  }
}

export const getJobMatches = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const matches = await JobMatch.find({ resumeId: resume._id, userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ matches })
  } catch (err) {
    next(err)
  }
}

export const deleteJobMatch = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const deleted = await JobMatch.findOneAndDelete({ _id: req.params.matchId, resumeId: resume._id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Match result not found' })

    res.json({ message: 'Job match result deleted successfully' })
  } catch (err) {
    next(err)
  }
}

export const generateCoverLetterForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }
    const { jd } = req.body
    if (!jd || !jd.trim()) {
      return res.status(400).json({ message: 'Job Description is required to generate cover letter' })
    }

    const coverLetterData = await createCoverLetter(resume.rawText, jd)

    // Save to Database
    const coverLetter = await CoverLetter.create({
      resumeId: resume._id,
      userId: req.user._id,
      jd,
      coverLetter: coverLetterData.coverLetter
    })

    res.json({ coverLetter })
  } catch (err) {
    next(err)
  }
}

export const getCoverLetters = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const coverLetters = await CoverLetter.find({ resumeId: resume._id, userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ coverLetters })
  } catch (err) {
    next(err)
  }
}

export const deleteCoverLetter = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const deleted = await CoverLetter.findOneAndDelete({ _id: req.params.clId, resumeId: resume._id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Cover letter not found' })

    res.json({ message: 'Cover letter deleted successfully' })
  } catch (err) {
    next(err)
  }
}

export const getInterviewPrepForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    // Check if we already have it saved
    const prep = await InterviewPrep.findOne({ resumeId: resume._id, userId: req.user._id })
    res.json({ prep: prep || null })
  } catch (err) {
    next(err)
  }
}

export const regenerateInterviewPrepForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }
    if (!resume.rawText) {
      return res.status(400).json({ message: 'Resume has no extracted text' })
    }
    const prepData = await generateInterviewQuestions(resume.rawText)
    
    let prep = await InterviewPrep.findOne({ resumeId: resume._id, userId: req.user._id })
    if (prep) {
      prep.questions = prepData.questions
      await prep.save()
    } else {
      prep = await InterviewPrep.create({
        resumeId: resume._id,
        userId: req.user._id,
        questions: prepData.questions
      })
    }
    res.json({ prep })
  } catch (err) {
    next(err)
  }
}

// ----------------------------------------------------
// CAREER ROADMAP & SKILL GAP CONTROLLER ACTIONS
// ----------------------------------------------------
export const getRoadmapByResumeId = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const roadmaps = await CareerRoadmap.find({ resumeId: resume._id, userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ roadmaps })
  } catch (err) {
    next(err)
  }
}

export const generateRoadmapForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    if (!resume.rawText) return res.status(400).json({ message: 'Resume has no extracted text' })

    const { targetRole } = req.body
    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({ message: 'Target role is required' })
    }

    const roadmapData = await generateCareerRoadmap(resume.rawText, targetRole)

    const roadmap = await CareerRoadmap.create({
      resumeId: resume._id,
      userId: req.user._id,
      targetRole,
      ...roadmapData,
    })

    res.json({ roadmap })
  } catch (err) {
    next(err)
  }
}

export const deleteRoadmap = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const deleted = await CareerRoadmap.findOneAndDelete({ _id: req.params.roadmapId, resumeId: resume._id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Roadmap not found' })

    res.json({ message: 'Career roadmap deleted successfully' })
  } catch (err) {
    next(err)
  }
}

// ----------------------------------------------------
// SALARY ESTIMATION & NEGOTIATION COACH CONTROLLER ACTIONS
// ----------------------------------------------------
export const getSalaryNegotiationsByResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const negotiations = await SalaryNegotiation.find({ resumeId: resume._id, userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ negotiations })
  } catch (err) {
    next(err)
  }
}

export const getSalaryNegotiationById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const negotiation = await SalaryNegotiation.findOne({ _id: req.params.negId, resumeId: resume._id, userId: req.user._id })
    if (!negotiation) return res.status(404).json({ message: 'Negotiation session not found' })

    res.json({ negotiation })
  } catch (err) {
    next(err)
  }
}

export const createSalaryNegotiation = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    if (!resume.rawText) return res.status(400).json({ message: 'Resume has no extracted text' })

    const { jobTitle, company, location } = req.body
    if (!jobTitle || !jobTitle.trim()) {
      return res.status(400).json({ message: 'Job title is required' })
    }

    const estimatesData = await getSalaryEstimates(resume.rawText, jobTitle, company, location)

    // Setup initial HR dialogue to kick off the roleplay chat
    const initialHrMessage = `Hello, thank you for taking the time to speak with me today. We are very excited about your candidacy for the ${jobTitle} position here at ${company || 'our company'}. Before we proceed with the offer details, I'd like to discuss your compensation expectations. Could you share what range you're looking for?`

    const negotiation = await SalaryNegotiation.create({
      resumeId: resume._id,
      userId: req.user._id,
      jobTitle,
      company: company || '',
      location: location || '',
      marketEstimates: estimatesData.marketEstimates,
      negotiationStrategy: estimatesData.negotiationStrategy,
      chatHistory: [
        {
          role: 'assistant',
          message: initialHrMessage,
          feedback: 'This is the start of the negotiation. State your target salary clearly, but justify it using the leverage points (unique skills/experience) listed above.',
        },
      ],
    })

    res.status(201).json({ negotiation })
  } catch (err) {
    next(err)
  }
}

export const sendNegotiationMessage = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const negotiation = await SalaryNegotiation.findOne({ _id: req.params.negId, resumeId: resume._id, userId: req.user._id })
    if (!negotiation) return res.status(404).json({ message: 'Negotiation session not found' })

    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' })
    }

    // 1. Save user message to history
    negotiation.chatHistory.push({
      role: 'user',
      message: message.trim(),
    })

    // 2. Call Gemini for response + feedback
    const aiResponse = await getNegotiationChatResponse(
      resume.rawText,
      negotiation.jobTitle,
      negotiation.company,
      negotiation.location,
      negotiation.marketEstimates,
      negotiation.negotiationStrategy,
      negotiation.chatHistory
    )

    // 3. Save assistant message and feedback to history
    negotiation.chatHistory.push({
      role: 'assistant',
      message: aiResponse.message,
      feedback: aiResponse.coachingFeedback,
    })

    await negotiation.save()

    res.json({ negotiation })
  } catch (err) {
    next(err)
  }
}

export const deleteSalaryNegotiation = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const deleted = await SalaryNegotiation.findOneAndDelete({ _id: req.params.negId, resumeId: resume._id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Negotiation session not found' })

    res.json({ message: 'Salary negotiation session deleted successfully' })
  } catch (err) {
    next(err)
  }
}

// ----------------------------------------------------
// NETWORKING MESSAGE GENERATOR CONTROLLER ACTIONS
// ----------------------------------------------------
export const generateNetworkingMessageForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    if (!resume.rawText) return res.status(400).json({ message: 'Resume has no extracted text' })

    const { messageType, recipientName, recipientTitle, company, jobTitle, context } = req.body
    if (!messageType) return res.status(400).json({ message: 'Message type is required' })

    const msgData = await generateNetworkingMessage(resume.rawText, {
      messageType, recipientName, recipientTitle, company, jobTitle, context,
    })

    const networkingMessage = await NetworkingMessage.create({
      resumeId: resume._id,
      userId: req.user._id,
      messageType,
      recipientName: recipientName || '',
      recipientTitle: recipientTitle || '',
      company: company || '',
      jobTitle: jobTitle || '',
      context: context || '',
      message: msgData.message,
      subject: msgData.subject || '',
    })

    res.status(201).json({ networkingMessage })
  } catch (err) {
    next(err)
  }
}

export const getNetworkingMessages = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const messages = await NetworkingMessage.find({ resumeId: resume._id, userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ messages })
  } catch (err) {
    next(err)
  }
}

export const deleteNetworkingMessage = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const deleted = await NetworkingMessage.findOneAndDelete({ _id: req.params.msgId, resumeId: resume._id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Networking message not found' })

    res.json({ message: 'Networking message deleted successfully' })
  } catch (err) {
    next(err)
  }
}

// ----------------------------------------------------
// MOCK INTERVIEW WITH VOICE/SPEECH CONTROLLER ACTIONS
// ----------------------------------------------------
export const startMockInterview = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    if (!resume.rawText) return res.status(400).json({ message: 'Resume has no extracted text' })

    const { questionType } = req.body
    const prepData = await generateMockInterviewQuestions(resume.rawText)

    const session = await MockInterviewSession.create({
      resumeId: resume._id,
      userId: req.user._id,
      questionType: questionType || 'mixed',
      questions: prepData.questions,
      currentQuestionIndex: 0,
      chatHistory: [
        {
          role: 'assistant',
          message: `Let's start your mock interview! I'll ask you ${prepData.questions.length} questions. Take your time and answer each one naturally. Good luck!`,
          feedback: '',
        },
        {
          role: 'assistant',
          message: `First question:\n\n${prepData.questions[0].question}`,
          feedback: '',
        },
      ],
    })

    res.status(201).json({ session })
  } catch (err) {
    next(err)
  }
}

export const getMockInterviewSessions = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const sessions = await MockInterviewSession.find({ resumeId: resume._id, userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ sessions })
  } catch (err) {
    next(err)
  }
}

export const submitMockInterviewAnswer = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const session = await MockInterviewSession.findOne({ _id: req.params.sessionId, resumeId: resume._id, userId: req.user._id })
    if (!session) return res.status(404).json({ message: 'Interview session not found' })
    if (session.isComplete) return res.status(400).json({ message: 'Interview session is already complete' })

    const { answer } = req.body
    if (!answer || !answer.trim()) return res.status(400).json({ message: 'Answer is required' })

    const currentQuestion = session.questions[session.currentQuestionIndex]
    if (!currentQuestion) return res.status(400).json({ message: 'No more questions in this session' })

    // Save user answer
    session.chatHistory.push({ role: 'user', message: answer, feedback: '' })

    // Get AI feedback on the answer
    const feedback = await evaluateAnswer(currentQuestion.question, answer, currentQuestion.type)

    // Store score
    const score = typeof feedback.score === 'number' ? feedback.score : 5
    session.scores.push({
      questionIndex: session.currentQuestionIndex,
      score,
      feedback: feedback.feedback || '',
      strengths: feedback.strengths || '',
      improvementTip: feedback.improvementTip || '',
    })

    // Recalculate average
    const total = session.scores.reduce((sum, s) => sum + s.score, 0)
    session.averageScore = Math.round((total / session.scores.length) * 10) / 10

    // Move to next question
    session.currentQuestionIndex += 1
    const isComplete = session.currentQuestionIndex >= session.questions.length

    const feedbackText = `${feedback.feedback}${feedback.strengths ? '\n\nStrengths: ' + feedback.strengths : ''}${feedback.improvementTip ? '\n\nTip: ' + feedback.improvementTip : ''}`

    // Feedback message (always shown)
    session.chatHistory.push({
      role: 'assistant',
      message: feedbackText,
      feedback: JSON.stringify(feedback),
    })

    // Next question or completion message
    if (isComplete) {
      session.isComplete = true
      session.completedAt = new Date()
      session.chatHistory.push({
        role: 'assistant',
        message: `Interview complete. Average score: ${session.averageScore}/10 — check the analytics section for a full breakdown.`,
        feedback: '',
      })
    } else {
      const nextQ = session.questions[session.currentQuestionIndex]
      session.chatHistory.push({
        role: 'assistant',
        message: `Next question:\n\n${nextQ.question}`,
        feedback: '',
      })
    }

    await session.save()
    res.json({ session })
  } catch (err) {
    next(err)
  }
}

export const deleteMockInterviewSession = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const deleted = await MockInterviewSession.findOneAndDelete({ _id: req.params.sessionId, resumeId: resume._id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Interview session not found' })

    res.json({ message: 'Interview session deleted successfully' })
  } catch (err) {
    next(err)
  }
}

// ----------------------------------------------------
// JOB APPLICATION TRACKER CONTROLLER ACTIONS
// ----------------------------------------------------
export const getJobApplications = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const applications = await JobApplication.find({ resumeId: resume._id, userId: req.user._id }).sort({ updatedAt: -1 })
    res.json({ applications })
  } catch (err) {
    next(err)
  }
}

export const createJobApplication = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const { company, jobTitle, jobUrl, location, salaryRange, notes } = req.body
    if (!company || !jobTitle) return res.status(400).json({ message: 'Company and job title are required' })

    const application = await JobApplication.create({
      resumeId: resume._id,
      userId: req.user._id,
      company, jobTitle, jobUrl: jobUrl || '', location: location || '',
      salaryRange: salaryRange || '', notes: notes || '',
    })

    res.status(201).json({ application })
  } catch (err) {
    next(err)
  }
}

export const updateJobApplication = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.appId, resumeId: resume._id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!application) return res.status(404).json({ message: 'Application not found' })

    res.json({ application })
  } catch (err) {
    next(err)
  }
}

export const deleteJobApplication = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const deleted = await JobApplication.findOneAndDelete({ _id: req.params.appId, resumeId: resume._id, userId: req.user._id })
    if (!deleted) return res.status(404).json({ message: 'Application not found' })

    res.json({ message: 'Application deleted successfully' })
  } catch (err) {
    next(err)
  }
}

// ----------------------------------------------------
// LINKEDIN PROFILE CONVERTER CONTROLLER ACTIONS
// ----------------------------------------------------
export const generateLinkedInProfileForResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    if (!resume.rawText) return res.status(400).json({ message: 'Resume has no extracted text' })

    const profileData = await generateLinkedInProfile(resume.rawText)

    // Check if a profile already exists and update or create
    let profile = await LinkedInProfile.findOne({ resumeId: resume._id, userId: req.user._id })
    if (profile) {
      profile.headline = profileData.headline
      profile.about = profileData.about
      profile.experience = profileData.experience || []
      profile.skills = profileData.skills || []
      profile.recommendations = profileData.recommendations || ''
      await profile.save()
    } else {
      profile = await LinkedInProfile.create({
        resumeId: resume._id,
        userId: req.user._id,
        headline: profileData.headline,
        about: profileData.about,
        experience: profileData.experience || [],
        skills: profileData.skills || [],
        recommendations: profileData.recommendations || '',
      })
    }

    res.json({ profile })
  } catch (err) {
    next(err)
  }
}

export const getLinkedInProfile = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id, deletedAt: null })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const profile = await LinkedInProfile.findOne({ resumeId: resume._id, userId: req.user._id })
    res.json({ profile: profile || null })
  } catch (err) {
    next(err)
  }
}

