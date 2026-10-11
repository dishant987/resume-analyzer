import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { ConfirmModal } from '../components/ui/confirm-modal'
import PageTransition from '../components/ui/page-transition'
import { CodingWorkspace } from '../components/ui/coding-workspace'
import { InterviewFeedbackModal } from '../components/ui/interview-feedback-modal'
import {
  Loader2, Mic, Send, Bot, User, Trash2, AlertCircle, Play, Square,
  Maximize2, Minimize2, Clock, BarChart3, Trophy, Target, Sparkles,
  Code2, Briefcase, FileText, CheckCircle2, RefreshCw, FileCheck
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { CustomTooltip } from '../components/ui/custom-tooltip'
import {
  useResume, useMockInterviewSessions, useStartMockInterview,
  useSubmitMockAnswer, useDeleteMockInterview, useAIInterviewRecommendation,
  useExecuteInterviewCode, useFinalizeMockInterview
} from '../lib/hooks/use-api'

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MockInterview() {
  const { resumeId } = useParams()
  const chatEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  const { data: resumeData, isLoading } = useResume(resumeId)
  const { data: sessionsData, isLoading: sessionsLoading } = useMockInterviewSessions(resumeId)
  const startMutation = useStartMockInterview()

  const submitMutation = useSubmitMockAnswer()
  const deleteMutation = useDeleteMockInterview()
  const recommendMutation = useAIInterviewRecommendation()
  const executeCodeMutation = useExecuteInterviewCode()
  const finalizeMutation = useFinalizeMockInterview()

  const resume = resumeData?.resume
  const sessions = sessionsData?.sessions || []

  // Setup options
  const [durationMinutes, setDurationMinutes] = useState(15)
  const [category, setCategory] = useState('technical') // 'technical' | 'hr' | 'ai_suggested'
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [aiRationale, setAiRationale] = useState('')

  // Live Session State
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [answer, setAnswer] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewingFeedbackSession, setViewingFeedbackSession] = useState(null)

  const activeSession = activeSessionId
    ? sessions.find((s) => s._id === activeSessionId)
    : sessions[0] || null

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.chatHistory])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Auto handle timeout
  const handleAutoFinish = useCallback(() => {
    if (activeSession && !activeSession.isComplete) {
      finalizeMutation.mutate({ resumeId, sessionId: activeSession._id }, {
        onSuccess: (data) => {
          setIsTimerRunning(false)
          setViewingFeedbackSession(data.session)
        }
      })
    }
  }, [activeSession, resumeId, finalizeMutation])

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            timerRef.current = null
            setIsTimerRunning(false)
            handleAutoFinish()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTimerRunning, handleAutoFinish])

  // Get AI Resume Recommendations
  const handleGetRecommendation = () => {
    setError('')
    recommendMutation.mutate(resumeId, {
      onSuccess: (data) => {
        const rec = data.recommendation
        if (rec) {
          if (rec.recommendedCategory) setCategory(rec.recommendedCategory)
          if (rec.recommendedLanguage) setSelectedLanguage(rec.recommendedLanguage)
          if (rec.recommendedDurationMinutes) setDurationMinutes(rec.recommendedDurationMinutes)
          if (rec.targetRole) setTargetRole(rec.targetRole)
          if (rec.rationale) setAiRationale(rec.rationale)
        }
      },
      onError: (err) => setError(err.message || 'Failed to generate recommendation'),
    })
  }

  // Start new mock interview
  const handleStartSession = () => {
    setError('')
    const totalSecs = (Number(durationMinutes) || 15) * 60
    setTimeLeft(totalSecs)
    setIsTimerRunning(true)
    setIsFullScreen(true)

    startMutation.mutate({
      id: resumeId,
      category,
      durationMinutes: Number(durationMinutes),
      selectedLanguage,
      targetRole,
      questionType: category === 'hr' ? 'behavioral' : 'technical',
    }, {
      onSuccess: (data) => {
        setActiveSessionId(data.session._id)
      },
      onError: (err) => {
        setError(err.message || 'Failed to start interview session')
        setIsTimerRunning(false)
        setIsFullScreen(false)
      },
    })
  }

  // Submit Answer (Voice/Text)
  const handleSubmitAnswer = () => {
    if (!answer.trim() || !activeSession) return
    setError('')
    const answerToSend = answer.trim()
    setAnswer('')
    submitMutation.mutate({
      resumeId,
      sessionId: activeSession._id,
      answer: answerToSend,
    }, {
      onError: (err) => setError(err.message),
      onSuccess: (data) => {
        if (data.session.isComplete) {
          setIsTimerRunning(false)
          setViewingFeedbackSession(data.session)
        }
        setActiveSessionId(data.session._id)
      },
    })
  }

  // Submit Code Solution
  const handleSubmitCodeSolution = (codeSubmission) => {
    if (!activeSession) return
    setError('')
    submitMutation.mutate({
      resumeId,
      sessionId: activeSession._id,
      answer: `Submitted ${codeSubmission.language.toUpperCase()} Solution (Passed ${codeSubmission.passedCount}/${codeSubmission.totalCount} Test Cases)`,
      codeSubmission,
    }, {
      onError: (err) => setError(err.message),
      onSuccess: (data) => {
        if (data.session.isComplete) {
          setIsTimerRunning(false)
          setViewingFeedbackSession(data.session)
        }
        setActiveSessionId(data.session._id)
      },
    })
  }

  // Execute Code against test cases
  const handleExecuteCode = async ({ language, code, testCases, question }) => {
    try {
      const data = await executeCodeMutation.mutateAsync({
        resumeId,
        language,
        code,
        testCases,
        question,
      })
      return data
    } catch (err) {
      setError(err.message || 'Code execution failed')
      return null
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    deleteMutation.mutate({ resumeId, sessionId: deleteTarget }, {
      onSuccess: () => {
        setDeleteTarget(null)
        setIsDeleting(false)
        if (activeSessionId === deleteTarget) setActiveSessionId(null)
      },
      onError: () => setIsDeleting(false),
    })
  }

  const toggleListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }
    if (isListening) {
      recognitionRef.current?.abort()
      setIsListening(false)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setAnswer((prev) => (prev ? prev + ' ' + transcript : transcript))
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])

  const currentQuestion = activeSession
    ? activeSession.questions?.[activeSession.currentQuestionIndex]
    : null

  const isCodingQuestion = currentQuestion?.type === 'coding' || (category === 'technical' && activeSession?.currentQuestionIndex % 2 === 1)

  // Full Screen Live Interview Overlay
  const renderFullScreen = () => (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/60 bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className={`font-mono text-base font-bold ${timeLeft <= 60 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          {activeSession && (
            <>
              <Badge variant="outline" className="text-xs">
                Question {activeSession.currentQuestionIndex + 1} of {activeSession.questions?.length || 0}
              </Badge>
              <Badge variant="secondary" className="text-xs uppercase">
                {activeSession.category || 'Technical'} Mode
              </Badge>
              {activeSession.selectedLanguage && (
                <Badge variant="outline" className="text-xs font-mono">
                  {activeSession.selectedLanguage.toUpperCase()}
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeSession && !activeSession.isComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                finalizeMutation.mutate({ resumeId, sessionId: activeSession._id }, {
                  onSuccess: (data) => {
                    setIsTimerRunning(false)
                    setIsFullScreen(false)
                    setViewingFeedbackSession(data.session)
                  }
                })
              }}
              className="h-8 text-xs font-medium border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
            >
              Finish Interview & View Feedback
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(false)}
            className="h-8 px-2"
            title="Minimize fullscreen"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Left Column: AI Assistant Chat & Questions History */}
        <div className={`flex flex-col border-r border-border/60 ${isCodingQuestion ? 'lg:col-span-5' : 'lg:col-span-12'} overflow-hidden bg-muted/10`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeSession?.chatHistory?.map((entry, idx) => {
              let parsedFeedback = null
              if (entry.feedback) { try { parsedFeedback = JSON.parse(entry.feedback) } catch { /* empty */ } }
              return (
                <div key={idx} className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${entry.role === 'user' ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
                    {entry.role === 'user' ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className={`max-w-[85%] ${entry.role === 'user' ? 'bg-primary/10' : 'bg-card border border-border/60'} rounded-2xl px-4 py-3 shadow-xs`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                    {entry.feedback && entry.role === 'assistant' && parsedFeedback && (
                      <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                        {parsedFeedback.score && (
                          <div className="flex items-center gap-2">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-bold">Score: {parsedFeedback.score}/10</span>
                          </div>
                        )}
                        {parsedFeedback.strengths && (
                          <p className="text-xs text-emerald-500"><strong>Strengths:</strong> {parsedFeedback.strengths}</p>
                        )}
                        {parsedFeedback.improvementTip && (
                          <p className="text-xs text-muted-foreground"><strong>Tip:</strong> {parsedFeedback.improvementTip}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Voice/Text Input Bar for Conversational / HR Questions */}
          {!isCodingQuestion && !activeSession?.isComplete && currentQuestion && (
            <div className="border-t border-border/60 bg-card p-4 shrink-0">
              <div className="space-y-3 max-w-3xl mx-auto w-full">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Question {activeSession.currentQuestionIndex + 1} of {activeSession.questions?.length}
                  </span>
                  <span className="text-[11px]">Speak or type your answer</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your response or use voice input..."
                    rows={3}
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm resize-none focus:ring-1 focus:ring-primary outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitAnswer() } }}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={isListening ? 'destructive' : 'outline'}
                      size="icon"
                      onClick={toggleListening}
                      className="h-10 w-10 shrink-0"
                      title={isListening ? 'Stop voice recording' : 'Start voice input'}
                    >
                      {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4 text-orange-500" />}
                    </Button>
                    <Button
                      size="icon"
                      onClick={handleSubmitAnswer}
                      disabled={submitMutation.isPending || !answer.trim()}
                      className="h-10 w-10 shrink-0 font-bold"
                    >
                      {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {isListening && (
                  <div className="flex items-center gap-2 text-xs text-orange-500 animate-pulse font-medium">
                    <Mic className="h-3.5 w-3.5" /> Listening... Speak clearly into your microphone.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Code Compiler & Test Suite Workspace (for coding questions) */}
        {isCodingQuestion && !activeSession?.isComplete && currentQuestion && (
          <div className="lg:col-span-7 h-full p-4 overflow-hidden bg-background">
            <CodingWorkspace
              question={currentQuestion}
              language={activeSession?.selectedLanguage || selectedLanguage}
              onLanguageChange={(lang) => setSelectedLanguage(lang)}
              onExecuteCode={handleExecuteCode}
              isExecuting={executeCodeMutation.isPending}
              onSubmitCode={handleSubmitCodeSolution}
              isSubmitting={submitMutation.isPending}
            />
          </div>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Resume Not Found</h2>
        <p className="text-sm text-muted-foreground">The resume associated with this interview could not be loaded.</p>
        <Button onClick={() => window.location.href = '/dashboard'}>Back to Dashboard</Button>
      </div>
    )
  }


  return (
    <PageTransition>
      {isFullScreen && activeSession && renderFullScreen()}

      {/* Post-Interview Comprehensive Feedback Modal */}
      {viewingFeedbackSession && (
        <InterviewFeedbackModal
          session={viewingFeedbackSession}
          onClose={() => setViewingFeedbackSession(null)}
        />
      )}

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        <AnalysisNavigation resume={resume} resumeId={resumeId} activeTab="mock-interview" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Live Technical & HR Interview</h1>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                AI Powered
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Practice live timed interviews with voice input, multi-language code compilation (JS, Python, Java, C++), and detailed post-interview reports.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Grid Layout: Setup Panel & Past Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left / Top: Custom Interview Configurator */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="rounded-3xl border-border/80 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-secondary/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Configure New Interview Session
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetRecommendation}
                    disabled={recommendMutation.isPending}
                    className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {recommendMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    AI Recommend from Resume
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {aiRationale && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" /> AI Resume Analysis Recommendation:
                    </div>
                    <p>{aiRationale}</p>
                  </div>
                )}

                {/* Target Role */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Target Job Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior React Developer, Full Stack Engineer"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Interview Category</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setCategory('technical')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                        category === 'technical'
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Code2 className="h-5 w-5 text-primary" />
                      <span className="text-xs font-bold text-foreground">Technical & Coding</span>
                      <span className="text-[11px] text-muted-foreground">Code compiler + algorithm questions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory('hr')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                        category === 'hr'
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <User className="h-5 w-5 text-indigo-500" />
                      <span className="text-xs font-bold text-foreground">HR & Behavioral</span>
                      <span className="text-[11px] text-muted-foreground">STAR method + scenario questions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory('ai_suggested')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 ${
                        category === 'ai_suggested'
                          ? 'border-primary bg-primary/10 text-primary shadow-xs'
                          : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      <span className="text-xs font-bold text-foreground">AI Suggested</span>
                      <span className="text-[11px] text-muted-foreground">Tailored to candidate's resume</span>
                    </button>
                  </div>
                </div>

                {/* Coding Language Selection (if technical) */}
                {category !== 'hr' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">Coding Language</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'javascript', label: 'JavaScript' },
                        { id: 'python', label: 'Python' },
                        { id: 'java', label: 'Java' },
                        { id: 'cpp', label: 'C++' },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setSelectedLanguage(lang.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                            selectedLanguage === lang.id
                              ? 'border-primary bg-primary/15 text-primary shadow-xs'
                              : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration / Timer Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Session Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          durationMinutes === mins
                            ? 'border-orange-500 bg-orange-500/15 text-orange-500 shadow-xs'
                            : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {mins} Mins
                      </button>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <Button
                  onClick={handleStartSession}
                  disabled={startMutation.isPending}
                  className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg gap-2"
                >
                  {startMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating AI Interview Questions...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 fill-current" />
                      Start Live Interview (Fullscreen & Timer)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right / Bottom: Past Sessions & Analytics */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-3xl border-border/80 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-emerald-500" />
                    Completed Interview Sessions
                  </span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {sessions.length} Total
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {sessionsLoading ? (
                  <Skeleton className="h-32 w-full rounded-2xl" />
                ) : sessions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Trophy className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs">No mock interview sessions completed yet. Start one above!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {sessions.map((s) => (
                      <div
                        key={s._id}
                        className="p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/40 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[11px] uppercase">
                              {s.category || s.questionType || 'Technical'}
                            </Badge>
                            {s.selectedLanguage && (
                              <Badge variant="outline" className="text-[11px] font-mono uppercase">
                                {s.selectedLanguage}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(s._id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {new Date(s.createdAt).toLocaleDateString()} at {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            Avg Score: {s.averageScore}/10
                          </span>
                        </div>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {s.questions?.length || 0} Questions
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingFeedbackSession(s)}
                            className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1 font-semibold"
                          >
                            <Trophy className="h-3 w-3 text-amber-500" />
                            View Feedback Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Interview Session?"
        description="Are you sure you want to delete this mock interview session history? This action cannot be undone."
        confirmLabel="Delete Session"
        isConfirming={isDeleting}
      />

    </PageTransition>
  )
}
