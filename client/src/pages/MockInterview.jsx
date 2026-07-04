import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { ConfirmModal } from '../components/ui/confirm-modal'
import PageTransition from '../components/ui/page-transition'
import {
  Loader2, Mic, Send, Bot, User, Trash2, AlertCircle, Play, Square,
  Maximize2, Minimize2, Clock, BarChart3, Trophy, Target
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Cell
} from 'recharts'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { useResume, useMockInterviewSessions, useStartMockInterview, useSubmitMockAnswer, useDeleteMockInterview } from '../lib/hooks/use-api'

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

  const resume = resumeData?.resume
  const sessions = sessionsData?.sessions || []

  const [activeSessionId, setActiveSessionId] = useState(null)
  const [answer, setAnswer] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [questionType, setQuestionType] = useState('mixed')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(600)
  const [timeLeft, setTimeLeft] = useState(600)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

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

  const handleAutoFinish = useCallback(() => {
    if (answer.trim() && activeSession && !activeSession.isComplete) {
      submitMutation.mutate({ resumeId, sessionId: activeSession._id, answer: answer.trim() })
    }
    setAnswer('')
  }, [answer, activeSession, resumeId, submitMutation])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning, handleAutoFinish])

  const handleStartSession = () => {
    setError('')
    setTimeLeft(totalSeconds)
    setIsTimerRunning(true)
    setIsFullScreen(true)
    startMutation.mutate({ id: resumeId, questionType }, {
      onSuccess: (data) => {
        setActiveSessionId(data.session._id)
      },
      onError: (err) => {
        setError(err.message)
        setIsTimerRunning(false)
        setIsFullScreen(false)
      },
    })
  }

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
          setTimeLeft(0)
        }
        setActiveSessionId(data.session._id)
      },
    })
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

  // Build chart data from session scores
  const scoreChartData = activeSession?.scores?.map((s, i) => ({
    name: `Q${i + 1}`,
    score: s.score,
    type: activeSession.questions?.[s.questionIndex]?.type || '',
  })) || []

  const completedSessions = sessions.filter((s) => s.isComplete && s.scores?.length > 0)
  const progressData = completedSessions.map((s, i) => ({
    name: `${i + 1}`,
    score: s.averageScore || 0,
    date: new Date(s.createdAt).toLocaleDateString(),
  }))

  // Full screen interview overlay
  const renderFullScreen = () => (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className={`font-mono text-lg font-bold ${timeLeft <= 60 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Q {activeSession.currentQuestionIndex + 1}/{activeSession.questions?.length || 0}
          </Badge>
          {activeSession?.averageScore > 0 && (
            <Badge variant="secondary" className="text-xs">
              Avg: {activeSession.averageScore}/10
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="sm"
            onClick={() => setIsFullScreen(false)}
            className="h-8 px-2"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {activeSession?.chatHistory?.map((entry, idx) => {
          let parsedFeedback = null
          if (entry.feedback) { try { parsedFeedback = JSON.parse(entry.feedback) } catch { /* empty */ } }
          return (
            <div key={idx} className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${entry.role === 'user' ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
                {entry.role === 'user' ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-orange-500" />}
              </div>
              <div className={`max-w-[80%] ${entry.role === 'user' ? 'bg-primary/10' : 'bg-secondary'} rounded-2xl px-4 py-3`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                {entry.feedback && entry.role === 'assistant' && idx > 0 && parsedFeedback && (
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

      {/* Answer input */}
      <div className="border-t border-border/50 bg-card p-4 shrink-0">
        {!activeSession?.isComplete && currentQuestion ? (
          <div className="space-y-3 max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Q{activeSession.currentQuestionIndex + 1} of {activeSession.questions?.length}
            </div>
            <div className="flex gap-2">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                rows={3}
                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitAnswer() } }}
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant={isListening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={toggleListening}
                  className="h-10 w-10 shrink-0"
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  onClick={handleSubmitAnswer}
                  disabled={submitMutation.isPending || !answer.trim()}
                  className="h-10 w-10 shrink-0"
                >
                  {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {isListening && (
              <div className="flex items-center gap-2 text-sm text-orange-500 animate-pulse">
                <Mic className="h-4 w-4" />
                Listening... speak your answer
              </div>
            )}
          </div>
        ) : activeSession?.isComplete ? (
          <div className="text-center py-4 max-w-3xl mx-auto">
            <p className="text-lg font-bold text-emerald-500">Interview Complete!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeSession.averageScore > 0 && `Average Score: ${activeSession.averageScore}/10`}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsFullScreen(false)}>
              <Minimize2 className="h-4 w-4 mr-1" /> Exit Full Screen
            </Button>
          </div>
        ) : null}
      </div>

      {error && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="w-full space-y-6 pt-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!resume) return null

  return (
    <>
      {/* Full screen overlay */}
      {isFullScreen && activeSession && renderFullScreen()}

      <PageTransition>
        <div className="w-full space-y-6 pt-4">
          <AnalysisNavigation resume={resume} resumeId={resumeId} />

          {/* Start New Session */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Mic className="h-5 w-5 text-orange-500" />
                Mock Interview with Voice
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Practice answering interview questions aloud. Get AI feedback on your responses.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                  >
                    <option value="mixed">Mixed (Technical + Behavioral)</option>
                    <option value="technical">Technical Only</option>
                    <option value="behavioral">Behavioral Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Duration (minutes)</label>
                  <select
                    value={totalSeconds}
                    onChange={(e) => { setTotalSeconds(Number(e.target.value)); setTimeLeft(Number(e.target.value)) }}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                  >
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                    <option value={900}>15 minutes</option>
                    <option value={1200}>20 minutes</option>
                    <option value={1800}>30 minutes</option>
                  </select>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button onClick={handleStartSession} disabled={startMutation.isPending} className="w-full">
                {startMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Starting Interview...</>
                ) : (
                  <><Play className="h-4 w-4" /> Start Mock Interview (Full Screen)</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Active Session Card (non-fullscreen view) */}
          {activeSession && !activeSession.isComplete && (
            <Card>
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Q {activeSession.currentQuestionIndex + 1}/{activeSession.questions?.length || 0}
                    </Badge>
                    {activeSession.isComplete && <Badge variant="secondary">Complete</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsFullScreen(true)} className="h-8">
                      <Maximize2 className="h-4 w-4 mr-1" /> Full Screen
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => setDeleteTarget(activeSession._id)}
                      className="text-destructive h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
                  {activeSession.chatHistory?.map((entry, idx) => {
                    let parsedFeedback = null
                    if (entry.feedback) { try { parsedFeedback = JSON.parse(entry.feedback) } catch { /* empty */ } }
                    return (
                      <div key={idx} className={`flex gap-3 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${entry.role === 'user' ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
                          {entry.role === 'user' ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-orange-500" />}
                        </div>
                        <div className={`max-w-[80%] ${entry.role === 'user' ? 'bg-primary/10' : 'bg-secondary'} rounded-2xl px-4 py-3`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.message}</p>
                          {entry.feedback && entry.role === 'assistant' && parsedFeedback?.score && (
                            <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2">
                              <Trophy className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-xs font-bold">Score: {parsedFeedback.score}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatEndRef} />
                </div>
                {currentQuestion && !activeSession.isComplete && (
                  <div className="border-t border-border/50 p-4 space-y-3">
                    <p className="text-xs text-muted-foreground text-center">
                      Q{activeSession.currentQuestionIndex + 1}: {currentQuestion.question}
                    </p>
                    <Button onClick={() => setIsFullScreen(true)} className="w-full">
                      <Maximize2 className="h-4 w-4 mr-1" /> Continue in Full Screen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analytics Section */}
          {completedSessions.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                  Your Progress & Analytics
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
                  {showAnalytics ? 'Hide' : 'Show'} Charts
                </Button>
              </CardHeader>
              {showAnalytics && (
                <CardContent className="space-y-8">
                  {/* Score trend across sessions */}
                  {progressData.length > 1 && (
                    <div>
                      <h4 className="text-sm font-bold mb-3">Score Trend Across Sessions</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f015" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} label={{ value: 'Session', position: 'bottom', fontSize: 10 }} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v}/10`, 'Avg Score']} labelFormatter={(l) => `Session ${l}`} />
                          <Line type="monotone" dataKey="score" stroke="var(--color-orange-500, #f97316)" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Current session per-question scores */}
                  {scoreChartData.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold mb-3">Per-Question Scores {activeSession?.isComplete ? '(Latest Session)' : ''}</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scoreChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f015" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v) => [`${v}/10`, 'Score']} />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40} fill="var(--color-orange-500, #f97316)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Session summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedSessions.slice(0, 6).map((s) => (
                      <Card key={s._id} className="border border-border/60">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </Badge>
                            <Badge variant={s.averageScore >= 7 ? 'secondary' : s.averageScore >= 4 ? 'outline' : 'destructive'} className="text-xs">
                              {s.averageScore}/10
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {s.questions?.length || 0} questions &middot; {s.scores?.length || 0} answered
                          </p>
                          <div className="flex gap-1">
                            {s.scores?.map((sc, i) => (
                              <div key={i} className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${sc.score >= 7 ? 'bg-emerald-500' : sc.score >= 4 ? 'bg-amber-500' : 'bg-destructive'}`}
                                  style={{ width: `${(sc.score / 10) * 100}%` }}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Past Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Past Interview Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <Skeleton className="h-32" />
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No interview sessions yet. Start a new session above.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={s.isComplete ? 'secondary' : 'outline'} className="text-xs">
                            {s.isComplete ? 'Completed' : 'In Progress'}
                          </Badge>
                          {s.averageScore > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {s.averageScore}/10
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {s.questions?.length || 0} questions &middot; {s.chatHistory?.length || 0} exchanges
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setActiveSessionId(s._id)}>
                          View
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setDeleteTarget(s._id)}
                          className="text-destructive h-8 px-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Session Detail */}
          {activeSession?.isComplete && !isFullScreen && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Session Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scoreChartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={scoreChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f015" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`${v}/10`, 'Score']} />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={50}>
                        {scoreChartData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.score >= 7 ? '#10b981' : entry.score >= 4 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-black text-foreground">{activeSession.averageScore || '-'}</p>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-foreground">{activeSession.scores?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Answered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-foreground">{activeSession.questions?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Questions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PageTransition>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Interview Session"
        description="Are you sure you want to delete this interview session? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Session'}
        confirmVariant="destructive"
        isConfirming={isDeleting}
      />
    </>
  )
}
