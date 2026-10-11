import { Button } from './button'
import { Badge } from './badge'
import { Trophy, CheckCircle2, AlertTriangle, Lightbulb, Target, ArrowRight, Printer, Star, Code } from 'lucide-react'

export function InterviewFeedbackModal({ session, onClose }) {
  if (!session) return null

  const feedback = session.finalFeedback || {}
  const overallScore = feedback.overallScore ?? (session.averageScore ? Math.round(session.averageScore * 10) : 75)
  const technicalScore = feedback.technicalScore ?? overallScore
  const communicationScore = feedback.communicationScore ?? overallScore
  const problemSolvingScore = feedback.problemSolvingScore ?? overallScore
  const codeQualityScore = feedback.codeQualityScore ?? overallScore

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    if (score >= 60) return 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    return 'text-rose-500 bg-rose-500/10 border-rose-500/30'
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border/80 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-secondary/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 flex items-center justify-center border border-amber-500/30">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Interview Performance Report</h2>
              <p className="text-xs text-muted-foreground">
                Role: <strong>{session.targetRole || 'Software Engineer'}</strong> | Category: <span className="uppercase font-semibold">{session.category || 'Technical'}</span> | Language: <span className="uppercase font-semibold">{session.selectedLanguage || 'JavaScript'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 px-3 text-xs gap-1.5">
              <Printer className="h-4 w-4" /> Print Report
            </Button>
            <Button size="sm" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
              Close Report
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className={`md:col-span-2 p-5 rounded-2xl border flex flex-col items-center justify-center text-center ${getScoreColor(overallScore)}`}>
              <span className="text-xs font-bold uppercase tracking-wider mb-1">Overall Interview Score</span>
              <div className="text-5xl font-black font-mono my-1">{overallScore}%</div>
              <Badge variant="outline" className="mt-2 text-xs font-semibold">
                {overallScore >= 80 ? '🌟 High Proficiency' : overallScore >= 60 ? '👍 Solid Competency' : '⚡ Room for Growth'}
              </Badge>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <span className="text-xs text-muted-foreground block mb-1">Technical Depth</span>
                <span className="text-xl font-bold font-mono text-foreground">{technicalScore}%</span>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${technicalScore}%` }} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <span className="text-xs text-muted-foreground block mb-1">Problem Solving</span>
                <span className="text-xl font-bold font-mono text-foreground">{problemSolvingScore}%</span>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${problemSolvingScore}%` }} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <span className="text-xs text-muted-foreground block mb-1">Communication</span>
                <span className="text-xl font-bold font-mono text-foreground">{communicationScore}%</span>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${communicationScore}%` }} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl border border-border bg-muted/20">
                <span className="text-xs text-muted-foreground block mb-1">Code Quality & Logic</span>
                <span className="text-xl font-bold font-mono text-foreground">{codeQualityScore}%</span>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${codeQualityScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          {feedback.summary && (
            <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Target className="h-4 w-4 text-primary" />
                Executive Feedback Summary
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{feedback.summary}</p>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Key Strengths
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {feedback.strengths?.length > 0 ? (
                  feedback.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Star className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">Clear response structure and steady pacing.</li>
                )}
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {feedback.improvements?.length > 0 ? (
                  feedback.improvements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-muted-foreground">Elaborate more on edge case testing and code complexity.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Actionable Advice */}
          {feedback.actionableAdvice?.length > 0 && (
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                <Lightbulb className="h-4 w-4" />
                Actionable Preparation Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {feedback.actionableAdvice.map((tip, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground block mb-1">Tip #{idx + 1}</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Q&A Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground">Question-by-Question Evaluation</h3>
            <div className="space-y-3">
              {session.questions?.map((q, idx) => {
                const scoreObj = session.scores?.find(s => s.questionIndex === idx)
                const codeSub = session.codingSubmissions?.find(cs => cs.questionIndex === idx)
                return (
                  <div key={idx} className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-mono">Q{idx + 1}</Badge>
                        <Badge className="text-xs uppercase" variant={q.type === 'coding' ? 'default' : 'secondary'}>
                          {q.type || 'technical'}
                        </Badge>
                      </div>
                      {scoreObj && (
                        <Badge className={getScoreColor(scoreObj.score * 10)}>
                          Score: {scoreObj.score}/10
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground">{q.question}</p>
                    
                    {codeSub && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1 font-mono text-xs">
                        <div className="flex items-center justify-between text-[11px] font-sans text-muted-foreground">
                          <span className="flex items-center gap-1"><Code className="h-3.5 w-3.5" /> Code Submitted ({codeSub.language})</span>
                          <span>Passed {codeSub.passedCount}/{codeSub.totalCount} Test Cases</span>
                        </div>
                        <pre className="p-2 bg-background rounded text-emerald-500 overflow-x-auto text-[11px] max-h-32">
                          {codeSub.code}
                        </pre>
                      </div>
                    )}

                    {scoreObj?.feedback && (
                      <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-xl border border-border/40">
                        <strong>Feedback:</strong> {scoreObj.feedback}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex justify-end shrink-0">
          <Button onClick={onClose} className="px-6 font-semibold">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
