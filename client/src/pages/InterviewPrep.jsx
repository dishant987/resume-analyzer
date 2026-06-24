import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition, { stagger, staggerContainer } from '../components/ui/page-transition'

import {
  Loader2, AlertCircle, MessageSquare, AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, BookOpen
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { useResume, useInterviewPrep, useGenerateInterviewPrep } from '../lib/hooks/use-api'

export default function InterviewPrep() {
  const { resumeId } = useParams()
  const navigate = useNavigate()

  const [prepError, setPrepError] = useState('')
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [userAnswers, setUserAnswers] = useState(() => {
    try {
      const stored = localStorage.getItem(`resulens-answers-${resumeId}`)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const [practicedKeys, setPracticedKeys] = useState(() => {
    try {
      const stored = localStorage.getItem(`resulens-practiced-${resumeId}`)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (resumeId) {
      localStorage.setItem(`resulens-answers-${resumeId}`, JSON.stringify(userAnswers))
    }
  }, [userAnswers, resumeId])

  useEffect(() => {
    if (resumeId) {
      localStorage.setItem(`resulens-practiced-${resumeId}`, JSON.stringify(practicedKeys))
    }
  }, [practicedKeys, resumeId])

  const { data: resumeData, isLoading: loading, error } = useResume(resumeId)
  const {
    data: prepData,
    isLoading: prepLoading,
    error: prepError_,
  } = useInterviewPrep(resumeId)

  const generateMutation = useGenerateInterviewPrep()

  const resume = resumeData?.resume
  const prep = prepData?.prep || null
  const generating = generateMutation.isPending
  const loadingAll = loading || prepLoading

  const handleGenerateQuestions = (isRegen = false) => {
    setPrepError('')
    generateMutation.mutate({ id: resumeId, isRegen }, {
      onSuccess: () => {
        setExpandedIndex(null)
      },
      onError: (err) => {
        setPrepError(err.message)
      },
    })
  }

  const toggleQuestion = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx)
  }

  if (loadingAll && !error) {
    return (
      <div className="w-full space-y-6 pt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !resume) {
    return (
      <PageTransition>
        <div className="text-center py-20 text-muted-foreground max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="font-bold text-lg text-foreground mb-1">Resume not found</p>
          <p className="text-sm">{error?.message || 'The document you are looking for does not exist or has been deleted.'}</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </PageTransition>
    )
  }

  const totalQuestions = prep?.questions?.length || 0
  const practicedCount = prep?.questions ? prep.questions.filter((_, idx) => practicedKeys[idx]).length : 0
  const progressPercent = totalQuestions > 0 ? Math.round((practicedCount / totalQuestions) * 100) : 0

  return (
    <PageTransition>
      <div className="w-full space-y-6 pt-2 pb-16">
        <AnalysisNavigation
          resume={resume}
          resumeId={resumeId}
          activeTab="interview"
        />

        {prepError && (
          <div className="p-4 text-sm bg-destructive/10 border border-destructive/25 text-destructive rounded-xl font-bold flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{prepError}</span>
          </div>
        )}

        {prep?.questions && prep.questions.length > 0 ? (
          <div className="space-y-6">
            {/* Stats Dashboard */}
            <Card className="border border-border bg-card overflow-hidden">
              <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/15">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Prep Session Progress</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      You have reviewed and practiced <span className="text-amber-500 font-bold">{practicedCount}</span> of <span className="text-foreground font-bold">{totalQuestions}</span> questions.
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-1.5">
                  <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <span>Practiced</span>
                    <span className="text-amber-500">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary/40 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateQuestions(true)}
                  disabled={generating}
                  className="font-bold text-xs gap-1.5 cursor-pointer hover:bg-amber-500/5 hover:text-amber-500 hover:border-amber-500/30"
                >
                  {generating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Regenerating...</>
                  ) : (
                    <><BookOpen className="h-3.5 w-3.5 text-amber-500" /> Regenerate Questions</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Split Screen Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Question Checklist/Sidebar */}
              <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {prep.questions.map((q, idx) => {
                  const isSelected = selectedIndex === idx
                  const isPracticed = !!practicedKeys[idx]
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`group border rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3 select-none ${isSelected
                          ? 'border-amber-500 bg-amber-500/5 shadow-xs'
                          : 'border-border bg-card hover:border-border-hover hover:bg-secondary/15'
                        }`}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          setPracticedKeys(prev => ({ ...prev, [idx]: !prev[idx] }))
                        }}
                        className={`h-5 w-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-all cursor-pointer ${isPracticed
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-border group-hover:border-amber-500/40 bg-background'
                          }`}
                      >
                        {isPracticed && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${q.type === 'technical' ? 'text-violet-500' : 'text-emerald-500'
                            }`}>
                            {q.type}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground font-mono">Q{idx + 1}</span>
                        </div>
                        <h4 className={`text-xs font-bold leading-relaxed truncate-3-lines ${isSelected ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                          {q.question}
                        </h4>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 mt-1 transition-transform ${isSelected ? 'text-amber-500 translate-x-0.5' : 'text-muted-foreground/30'
                        }`} />
                    </div>
                  )
                })}
              </div>

              {/* Right Column: Practice Zone */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-border bg-card overflow-hidden shadow-sm relative">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500" />

                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={prep.questions[selectedIndex]?.type === 'technical' ? 'accent' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider">
                        {prep.questions[selectedIndex]?.type}
                      </Badge>
                      <span className="text-[10px] font-black text-muted-foreground font-mono">QUESTION {selectedIndex + 1} OF {totalQuestions}</span>
                    </div>
                    <CardTitle className="text-lg font-black text-foreground leading-relaxed">
                      {prep.questions[selectedIndex]?.question}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Practice Area */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Draft Your Response (Practice Area)</label>
                      <textarea
                        value={userAnswers[selectedIndex] || ''}
                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [selectedIndex]: e.target.value }))}
                        placeholder="Type your response here to practice..."
                        rows={6}
                        className="w-full rounded-xl border border-border bg-secondary/15 p-4 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none font-sans leading-relaxed text-foreground"
                      />
                    </div>

                    {/* Suggested Response Guidelines Accordion */}
                    <Card className="border border-border/60 bg-secondary/5 overflow-hidden">
                      <div className="p-4 border-b border-border/50 bg-secondary/15">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Suggested Response Guidelines</h4>
                        <p className="text-xs text-foreground/90 font-medium whitespace-pre-wrap mt-2 leading-relaxed">
                          {prep.questions[selectedIndex]?.suggestedAnswer}
                        </p>
                      </div>

                      <div className="p-4 bg-amber-500/5 space-y-1">
                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Coaching Tip
                        </div>
                        <p className="text-muted-foreground font-semibold text-xs leading-relaxed">
                          {prep.questions[selectedIndex]?.tips}
                        </p>
                      </div>
                    </Card>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUserAnswers(prev => ({ ...prev, [selectedIndex]: '' }))}
                        className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Reset Draft
                      </Button>

                      <Button
                        onClick={() => setPracticedKeys(prev => ({ ...prev, [selectedIndex]: !prev[selectedIndex] }))}
                        variant={practicedKeys[selectedIndex] ? 'outline' : 'default'}
                        size="sm"
                        className="font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
                      >
                        {practicedKeys[selectedIndex] ? (
                          <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed</>
                        ) : (
                          <>Mark as Completed</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          !loadingAll && (
            generating ? (
              <Card className="border border-border rounded-2xl p-12 text-center text-muted-foreground bg-secondary/5">
                <Loader2 className="h-10 w-10 mx-auto mb-3 text-primary animate-spin" />
                <h3 className="font-bold text-foreground text-sm mb-1">Analyzing Resume & Generating Questions...</h3>
                <p className="text-xs max-w-sm mx-auto leading-relaxed text-muted-foreground">
                  Our AI is reading your resume, identifying key competencies, and drafting tailored mock interview questions. This may take up to a minute.
                </p>
              </Card>
            ) : (
              <Card className="border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                <h3 className="font-bold text-foreground text-sm mb-1">Generate Interview Prep</h3>
                <p className="text-xs max-w-sm mx-auto mb-5">
                  Generate personalized interview questions with response guides and expert tips based on this resume.
                </p>
                <Button onClick={() => handleGenerateQuestions(false)} className="shadow-md shadow-primary/15 font-bold cursor-pointer">
                  <BookOpen className="h-4 w-4" /> Generate Prep Questions
                </Button>
              </Card>
            )
          )
        )}
      </div>
    </PageTransition>
  )
}
