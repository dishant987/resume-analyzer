import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition, { stagger, staggerContainer } from '../components/ui/page-transition'
import { motion } from 'framer-motion'
import {
  Sparkles, Loader2, AlertCircle, ArrowLeft, Wand2, CheckCircle2, XCircle, AlertTriangle,
  Briefcase, Mail, MessageSquare, Copy, Check, FileDown, ShieldAlert
} from 'lucide-react'

const severityBadge = {
  low: { label: 'Low Severity', variant: 'secondary' },
  medium: { label: 'Medium Severity', variant: 'warning' },
  high: { label: 'High Severity', variant: 'destructive' },
  critical: { label: 'Critical Issue', variant: 'destructive' },
}

const scoreLabels = {
  atsScore: 'ATS Compatibility',
  summaryScore: 'Summary',
  skillsScore: 'Skills',
  experienceScore: 'Experience',
  projectsScore: 'Projects',
  grammarScore: 'Grammar & Tone',
}

function ScoreCard({ label, value }) {
  const score = Math.round(value ?? 0)
  const isGood = score >= 80
  const isWarning = score >= 60 && score < 80
  
  let scoreColorClass = 'text-destructive'
  let progressColorClass = 'bg-destructive'
  let statusIcon = XCircle
  let statusText = 'Needs improvement'

  if (isGood) {
    scoreColorClass = 'text-emerald-500'
    progressColorClass = 'bg-emerald-500'
    statusIcon = CheckCircle2
    statusText = 'Optimal'
  } else if (isWarning) {
    scoreColorClass = 'text-amber-500'
    progressColorClass = 'bg-amber-500'
    statusIcon = AlertTriangle
    statusText = 'Needs work'
  }

  const StatusIcon = statusIcon

  return (
    <motion.div variants={stagger}>
      <Card className="hover:shadow-md transition-all duration-200 border border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className={`text-2xl font-black ${scoreColorClass}`} aria-label={`${label}: ${score} out of 100, ${statusText}`}>
              {score}
            </span>
          </div>
          
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${progressColorClass}`}
              style={{ width: `${score}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <StatusIcon className="h-4 w-4 shrink-0" />
            <span>{statusText}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function Analysis() {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState('audit')
  const [jd, setJd] = useState('')
  const [matching, setMatching] = useState(false)
  const [matchResults, setMatchResults] = useState(null)
  const [jdError, setJdError] = useState('')

  const [coverLetterJd, setCoverLetterJd] = useState('')
  const [generatingCl, setGeneratingCl] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [clError, setClError] = useState('')
  const [copiedCl, setCopiedCl] = useState(false)

  const [loadingPrep, setLoadingPrep] = useState(false)
  const [prepQuestions, setPrepQuestions] = useState(null)
  const [prepError, setPrepError] = useState('')
  const [expandedPrepIndex, setExpandedPrepIndex] = useState(null)

  const handleMatchJd = async () => {
    setMatching(true)
    setJdError('')
    try {
      const res = await fetch(`/api/resumes/${resumeId}/match-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Matching failed')
      setMatchResults(data.match)
    } catch (err) {
      setJdError(err.message)
    } finally {
      setMatching(false)
    }
  }

  const handleGenerateCoverLetter = async () => {
    setGeneratingCl(true)
    setClError('')
    try {
      const res = await fetch(`/api/resumes/${resumeId}/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: coverLetterJd }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Generation failed')
      setCoverLetter(data.coverLetter)
    } catch (err) {
      setClError(err.message)
    } finally {
      setGeneratingCl(false)
    }
  }

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter)
    setCopiedCl(true)
    setTimeout(() => setCopiedCl(false), 2000)
  }

  const handleDownloadCoverLetter = () => {
    const element = document.createElement("a");
    const file = new Blob([coverLetter], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `cover-letter-${resume.originalFilename.replace(/\.[^.]+$/, '')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleLoadInterviewPrep = async () => {
    setLoadingPrep(true)
    setPrepError('')
    try {
      const res = await fetch(`/api/resumes/${resumeId}/interview-prep`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Interview prep generation failed')
      setPrepQuestions(data.questions)
    } catch (err) {
      setPrepError(err.message)
    } finally {
      setLoadingPrep(false)
    }
  }

  const togglePrepQuestion = (idx) => {
    setExpandedPrepIndex(expandedPrepIndex === idx ? null : idx)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [resumeRes, analysisRes] = await Promise.all([
        fetch(`/api/resumes/${resumeId}`, { credentials: 'include' }).then((r) => r.json()),
        fetch(`/api/resumes/${resumeId}/analysis`, { credentials: 'include' }).then((r) => r.json()),
      ])
      setResume(resumeRes.resume)
      if (analysisRes.analysis) setAnalysis(analysisRes.analysis)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [resumeId])

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setError('')
    try {
      const res = await fetch(`/api/resumes/${resumeId}/analyze`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Analysis failed')
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!resume) {
    return (
      <PageTransition>
        <div className="text-center py-20 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="font-bold text-lg text-foreground mb-1">Resume not found</p>
          <p className="text-sm">The document you are looking for does not exist or has been deleted.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4.5 w-4.5" /> Back to Dashboard
          </Button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto space-y-6 pt-2 pb-16">
        
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to dashboard
        </button>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-foreground truncate tracking-tight">{resume.originalFilename}</h1>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
              <span>Uploaded {new Date(resume.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              <span>&bull;</span>
              <span className="capitalize font-semibold text-primary">{resume.status}</span>
            </p>
          </div>
          
          {/* Action Trigger */}
          <div className="shrink-0">
            {resume.status === 'uploaded' && (
              <Button onClick={handleAnalyze} disabled={analyzing} size="lg" className="w-full sm:w-auto shadow-md shadow-primary/15">
                {analyzing ? (
                  <><Loader2 className="h-4.5 w-4.5 animate-spin" /> Running AI Scan...</>
                ) : (
                  <><Sparkles className="h-4.5 w-4.5" /> Run AI Analysis</>
                )}
              </Button>
            )}
            {resume.status === 'analyzed' && (
              <Button onClick={() => navigate(`/editor/${resumeId}`)} size="lg" className="w-full sm:w-auto shadow-md shadow-primary/15">
                <Wand2 className="h-4.5 w-4.5" /> Optimize Side-by-Side
              </Button>
            )}
            {resume.status === 'improved' && (
              <Button onClick={() => navigate(`/editor/${resumeId}`)} size="lg" variant="outline" className="w-full sm:w-auto">
                <Wand2 className="h-4.5 w-4.5" /> View Improvements
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="shadow-sm border-destructive/25 bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3 text-sm text-destructive font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </CardContent>
          </Card>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Tab Bar */}
            <div className="flex border-b border-border/50 mb-6 overflow-x-auto scrollbar-none">
              {[
                { id: 'audit', label: 'ATS Audit Scan', icon: ShieldAlert },
                { id: 'jd', label: 'ATS Job Matcher', icon: Briefcase },
                { id: 'cover-letter', label: 'Cover Letter', icon: Mail },
                { id: 'interview', label: 'Interview Prep', icon: MessageSquare }
              ].map((tab) => {
                const TabIcon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer -mb-px ${
                      active 
                        ? 'border-primary text-primary' 
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TabIcon className="h-4.5 w-4.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Audit Scan Panel */}
            {activeTab === 'audit' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Verdict & Strengths Card */}
                {(analysis.summaryVerdict || (analysis.strengths && analysis.strengths.length > 0)) && (
                  <Card className="shadow-sm border border-border bg-card overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
                      {/* Left: Overall Verdict */}
                      {analysis.summaryVerdict && (
                        <div className="p-6 md:col-span-3 space-y-3">
                          <div className="flex items-center gap-2 text-primary">
                            <Sparkles className="h-5 w-5 fill-primary/10 animate-pulse" />
                            <span className="text-sm font-extrabold uppercase tracking-wider">Overall ATS Verdict</span>
                          </div>
                          <p className="text-foreground text-sm font-medium leading-relaxed">
                            {analysis.summaryVerdict}
                          </p>
                        </div>
                      )}
                      
                      {/* Right: Key Strengths */}
                      {analysis.strengths && analysis.strengths.length > 0 && (
                        <div className="p-6 md:col-span-2 space-y-3 bg-secondary/5">
                          <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/10" />
                            <span className="text-sm font-extrabold uppercase tracking-wider">Key Strengths</span>
                          </div>
                          <ul className="space-y-2">
                            {analysis.strengths.map((strength, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-muted-foreground leading-relaxed">
                                <span className="text-emerald-500 text-base leading-none select-none mt-0.5">•</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Score Grid */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {Object.entries(scoreLabels).map(([key, label]) => (
                    <ScoreCard key={key} label={label} value={analysis[key]} />
                  ))}
                </motion.div>

                {/* Checklist & Keywords Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: ATS Checklist */}
                  {analysis.checklist && analysis.checklist.length > 0 && (
                    <Card className={`shadow-sm border border-border ${!analysis.missingSkills?.length ? 'md:col-span-2' : ''}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-foreground">ATS Compliance Checklist</CardTitle>
                        <p className="text-xs text-muted-foreground">Standard checklist to verify structure compatibility with parsing algorithms.</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3.5">
                          {analysis.checklist.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/10 transition-colors">
                              {item.passed ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5 fill-emerald-500/10" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5 fill-destructive/10" />
                              )}
                              <div className="space-y-0.5">
                                <div className={`text-sm font-bold ${item.passed ? 'text-foreground' : 'text-foreground/90'}`}>
                                  {item.label}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium leading-normal">
                                  {item.feedback}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Column 2: Recommended Skill Keywords */}
                  {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                    <Card className={`shadow-sm border border-border flex flex-col justify-between ${!analysis.checklist?.length ? 'md:col-span-2' : ''}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold text-foreground">Recommended Skill Keywords</CardTitle>
                        <p className="text-xs text-muted-foreground">Adding these highly-searched terms can improve your ATS scan match rate.</p>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="flex flex-wrap gap-2.5">
                          {analysis.missingSkills.map((s) => (
                            <Badge key={s} variant="accent" className="font-bold py-1.5 px-3 border border-primary/20">+ {s}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Issues Found */}
                <motion.div variants={staggerContainer} initial="initial" animate="animate">
                  <Card className="shadow-sm border border-border">
                    <CardHeader className="border-b border-border/50 pb-4">
                      <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        Analysis Breakdown
                        <Badge variant="outline" className="ml-1 text-xs">
                          {analysis.issues?.length ?? 0} {analysis.issues?.length === 1 ? 'Issue' : 'Issues'} Found
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-border/60">
                      {analysis.issues && analysis.issues.length > 0 ? (
                        analysis.issues.map((issue, i) => (
                          <motion.div
                            key={i}
                            variants={stagger}
                            className="p-5 space-y-3 hover:bg-secondary/15 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono tracking-wider bg-secondary text-foreground px-2.5 py-1 rounded border border-border/50 uppercase">
                                  {issue.section}
                                </span>
                                <Badge variant={severityBadge[issue.severity]?.variant}>
                                  {severityBadge[issue.severity]?.label}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm font-semibold text-foreground leading-relaxed">
                              {issue.problem}
                            </p>
                            
                            <div className="text-sm text-primary bg-primary/5 rounded-xl p-4 border border-primary/10 leading-relaxed space-y-1">
                              <div className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80">Gemini Recommendation</div>
                              <p className="font-medium">{issue.suggestion}</p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                          <p className="font-bold text-foreground">Perfect scan!</p>
                          <p className="text-xs">No issues found on your resume.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* JD Matcher Panel */}
            {activeTab === 'jd' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Job Description Compatibility Matcher
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Paste the job posting description below to test how well your resume matches the role requirements, identify missing keywords, and get custom recommendations.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      placeholder="Paste the job description here..."
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-border bg-secondary/25 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-sans leading-relaxed text-foreground"
                      disabled={matching}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleMatchJd}
                        disabled={matching || !jd.trim()}
                        className="shadow-md shadow-primary/15"
                      >
                        {matching ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Scanning JD Match...</>
                        ) : (
                          <><Sparkles className="h-4 w-4" /> Compare Resume & JD</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {jdError && (
                  <Card className="border-destructive/20 bg-destructive/10">
                    <CardContent className="p-4 text-sm text-destructive font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 shrink-0" /> {jdError}
                    </CardContent>
                  </Card>
                )}

                {matchResults && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="border border-border md:col-span-1 flex flex-col justify-center items-center p-6 text-center">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Overall JD Match</div>
                        <div className="relative flex items-center justify-center">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" className="text-secondary" fill="transparent" />
                            <circle
                              cx="64"
                              cy="64"
                              r="54"
                              stroke="currentColor"
                              strokeWidth="8"
                              className={matchResults.matchPercentage >= 80 ? 'text-emerald-500' : matchResults.matchPercentage >= 50 ? 'text-amber-500' : 'text-destructive'}
                              fill="transparent"
                              strokeDasharray={339.3}
                              strokeDashoffset={339.3 - (339.3 * matchResults.matchPercentage) / 100}
                            />
                          </svg>
                          <div className="absolute text-3xl font-black">{Math.round(matchResults.matchPercentage)}%</div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-4">Compatibility Score</p>
                      </Card>
                      
                      <Card className="border border-border md:col-span-2 p-6 flex flex-col justify-center">
                        <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">AI Match Evaluation</div>
                        <p className="text-sm font-medium text-foreground leading-relaxed">
                          {matchResults.explanation}
                        </p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border border-border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-bold text-foreground">Matched Keywords</CardTitle>
                          <p className="text-xs text-muted-foreground">These terms match the target job profile perfectly.</p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1.5">
                            {matchResults.matchedKeywords?.length > 0 ? (
                              matchResults.matchedKeywords.map((kw, idx) => (
                                <Badge key={idx} variant="success" className="px-2.5 py-1 text-xs">✓ {kw}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No matching keywords found.</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border border-border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-bold text-foreground">Missing Keywords</CardTitle>
                          <p className="text-xs text-muted-foreground">Add these keywords to pass target filters.</p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1.5">
                            {matchResults.missingKeywords?.length > 0 ? (
                              matchResults.missingKeywords.map((kw, idx) => (
                                <Badge key={idx} variant="destructive" className="px-2.5 py-1 text-xs">+ {kw}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No missing keywords found! Fantastic.</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border border-border">
                      <CardHeader>
                        <CardTitle className="text-sm font-bold">Recommendations for Alignment</CardTitle>
                        <p className="text-xs text-muted-foreground">Specific advice to custom-tailor your resume for this position.</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {matchResults.recommendations?.map((rec, idx) => (
                          <div key={idx} className="flex gap-3 text-sm">
                            <span className="text-primary font-bold">{idx + 1}.</span>
                            <p className="text-foreground/90 leading-relaxed font-medium">{rec}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Cover Letter Panel */}
            {activeTab === 'cover-letter' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      AI Cover Letter Generator
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Automatically generate a tailored cover letter based on your resume and a target job description. Paste the job description below to start.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      placeholder="Paste the job description for target cover letter here..."
                      value={coverLetterJd}
                      onChange={(e) => setCoverLetterJd(e.target.value)}
                      rows={5}
                      className="w-full rounded-xl border border-border bg-secondary/25 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-sans leading-relaxed text-foreground"
                      disabled={generatingCl}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleGenerateCoverLetter}
                        disabled={generatingCl || !coverLetterJd.trim()}
                        className="shadow-md shadow-primary/15"
                      >
                        {generatingCl ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Drafting Cover Letter...</>
                        ) : (
                          <><Sparkles className="h-4 w-4" /> Generate Cover Letter</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {clError && (
                  <Card className="border-destructive/20 bg-destructive/10">
                    <CardContent className="p-4 text-sm text-destructive font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 shrink-0" /> {clError}
                    </CardContent>
                  </Card>
                )}

                {coverLetter && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <Card className="border border-border bg-card overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-6 py-3.5 flex-wrap gap-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tailored Cover Letter Draft</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyCoverLetter}
                            className="gap-1.5 h-9"
                          >
                            {copiedCl ? (
                              <><Check className="h-4 w-4 text-emerald-500" /> Copied</>
                            ) : (
                              <><Copy className="h-4 w-4" /> Copy Text</>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownloadCoverLetter}
                            className="gap-1.5 h-9"
                          >
                            <FileDown className="h-4 w-4" /> Download TXT
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-6 sm:p-8">
                        <textarea
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={16}
                          className="w-full text-sm text-foreground bg-transparent border-0 focus:outline-none resize-y leading-relaxed font-mono whitespace-pre-wrap"
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Interview Prep Panel */}
            {activeTab === 'interview' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border border-border">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        AI Mock Interview Questions
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Personalized questions curated from your resume experiences, with optimal answers and expert-level feedback guidelines.
                      </p>
                    </div>
                    {!prepQuestions && !loadingPrep && (
                      <Button onClick={handleLoadInterviewPrep} className="shadow-md shadow-primary/15 shrink-0">
                        <Sparkles className="h-4 w-4" /> Generate Questions
                      </Button>
                    )}
                  </CardHeader>
                </Card>

                {loadingPrep && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-28 rounded-2xl w-full" />
                    ))}
                  </div>
                )}

                {prepError && (
                  <Card className="border-destructive/20 bg-destructive/10">
                    <CardContent className="p-4 text-sm text-destructive font-semibold flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 shrink-0" /> {prepError}
                    </CardContent>
                  </Card>
                )}

                {prepQuestions && (
                  <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-4"
                  >
                    {prepQuestions.map((q, idx) => (
                      <Card key={idx} className="border border-border overflow-hidden shadow-xs hover:border-primary/20 transition-all">
                        <CardHeader 
                          className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/10 cursor-pointer"
                          onClick={() => togglePrepQuestion(idx)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-bold font-mono text-primary text-sm h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <h3 className="font-bold text-foreground text-sm leading-relaxed">{q.question}</h3>
                              <Badge variant={q.type === 'technical' ? 'accent' : 'secondary'} className="mt-2 text-[10px] uppercase font-bold tracking-wider">
                                {q.type}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs shrink-0 self-end sm:self-center font-bold">
                            {expandedPrepIndex === idx ? 'Hide Guide' : 'Show Guide'}
                          </Button>
                        </CardHeader>
                        
                        <AnimatePresence>
                          {expandedPrepIndex === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-border/50 bg-card"
                            >
                              <div className="p-6 space-y-4 text-sm leading-relaxed">
                                <div className="space-y-1.5">
                                  <div className="text-[10px] font-black text-primary uppercase tracking-widest">Suggested Response Guidelines</div>
                                  <p className="text-foreground/90 font-medium whitespace-pre-wrap">{q.suggestedAnswer}</p>
                                </div>
                                
                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
                                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Coaching Tip
                                  </div>
                                  <p className="text-muted-foreground font-medium text-xs leading-relaxed">{q.tips}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {!analysis && resume.status === 'uploaded' && (
          <Card className="shadow-xs border border-border">
            <CardContent className="text-center py-20">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-foreground font-bold text-lg mb-2">Resume Uploaded</p>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Your resume file has been successfully uploaded and is ready for scoring. Let AI analyze it across key categories.
              </p>
              <Button onClick={handleAnalyze} disabled={analyzing} size="lg">
                {analyzing ? (
                  <><Loader2 className="h-4.5 w-4.5 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="h-4.5 w-4.5" /> Analyze with AI</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
