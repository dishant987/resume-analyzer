import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition, { stagger, staggerContainer } from '../components/ui/page-transition'
import { motion } from 'framer-motion'
import {
  Loader2, AlertCircle, CheckCircle2, XCircle, AlertTriangle,
  Briefcase, Mail, MessageSquare, ArrowRight, Compass, Coins
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { useResume, useAnalysis, useAnalyzeResume } from '../lib/hooks/use-api'

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

  const { data: resumeData, isLoading: loading, error } = useResume(resumeId)
  const { data: analysisData } = useAnalysis(resumeId)
  const analyzeMutation = useAnalyzeResume()

  const resume = resumeData?.resume
  const analysis = analysisData?.analysis
  const analyzing = analyzeMutation.isPending

  if (loading) {
    return (
      <div className="w-full space-y-6 pt-4">
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

  return (
    <PageTransition>
      <div className="w-full space-y-6 pt-2 pb-16">
        
        <AnalysisNavigation
          resume={resume}
          resumeId={resumeId}
          activeTab="audit"
          onAnalyze={() => analyzeMutation.mutate(resumeId)}
          analyzing={analyzing}
        />

        {error && (
          <Card className="shadow-sm border-destructive/25 bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3 text-sm text-destructive font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </CardContent>
          </Card>
        )}

        {analysis ? (
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
                        <CheckCircle2 className="h-5 w-5" />
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

            {/* AI Optimization Suite */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 pt-2"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">Optimization Suite</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Job Matcher Card */}
                <Card className="border border-border bg-card hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
                  <CardContent className="p-5 flex flex-col justify-between h-full min-h-[190px]">
                    <div className="space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/15">
                        <Briefcase className="h-5.5 w-5.5" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">ATS Job Matcher</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Compare your resume with a specific job posting. Scan for missing keywords and get alignment recommendations.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/analysis/${resumeId}/job-matcher`)}
                      variant="outline" 
                      size="sm" 
                      className="mt-5 w-full border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/40 text-xs font-bold gap-1 rounded-xl transition-all cursor-pointer"
                    >
                      Open Matcher
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Cover Letter Card */}
                <Card className="border border-border bg-card hover:border-violet-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all duration-300" />
                  <CardContent className="p-5 flex flex-col justify-between h-full min-h-[190px]">
                    <div className="space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-4 border border-violet-500/15">
                        <Mail className="h-5.5 w-5.5" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">Cover Letter Generator</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Draft a highly personalized cover letter tailored to a specific job description and matching your resume profile.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/analysis/${resumeId}/cover-letter`)}
                      variant="outline" 
                      size="sm" 
                      className="mt-5 w-full border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-500 hover:border-violet-500/40 text-xs font-bold gap-1 rounded-xl transition-all cursor-pointer"
                    >
                      Draft Cover Letter
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Interview Prep Card */}
                <Card className="border border-border bg-card hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-300" />
                  <CardContent className="p-5 flex flex-col justify-between h-full min-h-[190px]">
                    <div className="space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 border border-amber-500/15">
                        <MessageSquare className="h-5.5 w-5.5" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">Interview Prep Coach</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Prepare for mock interview questions with guidelines and response tips customized for this resume.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/analysis/${resumeId}/interview-prep`)}
                      variant="outline" 
                      size="sm" 
                      className="mt-5 w-full border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/40 text-xs font-bold gap-1 rounded-xl transition-all cursor-pointer"
                    >
                      Start Prep Coach
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Career Roadmap Card */}
                <Card className="border border-border bg-card hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300" />
                  <CardContent className="p-5 flex flex-col justify-between h-full min-h-[190px]">
                    <div className="space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 border border-indigo-500/15">
                        <Compass className="h-5.5 w-5.5" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">Career Roadmap & Gaps</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Define target roles, identify critical skill gaps, and view a customized 6-month timeline timeline path for success.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/analysis/${resumeId}/roadmap`)}
                      variant="outline" 
                      size="sm" 
                      className="mt-5 w-full border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-500 hover:border-indigo-500/40 text-xs font-bold gap-1 rounded-xl transition-all cursor-pointer"
                    >
                      Open Roadmap
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Salary Negotiator Card */}
                <Card className="border border-border bg-card hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all duration-300" />
                  <CardContent className="p-5 flex flex-col justify-between h-full min-h-[190px]">
                    <div className="space-y-2">
                      <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-4 border border-teal-500/15">
                        <Coins className="h-5.5 w-5.5" />
                      </div>
                      <h3 className="font-bold text-sm text-foreground">Salary Negotiation Coach</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Roleplay salary conversations with HR. Get market value benchmarks and side-by-side coaching guidance.
                      </p>
                    </div>
                    <Button 
                      onClick={() => navigate(`/analysis/${resumeId}/salary-negotiation`)}
                      variant="outline" 
                      size="sm" 
                      className="mt-5 w-full border-teal-500/20 hover:bg-teal-500/10 hover:text-teal-500 hover:border-teal-500/40 text-xs font-bold gap-1 rounded-xl transition-all cursor-pointer"
                    >
                      Practice Negotiation
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
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
                          <div className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80">ResuLens Recommendation</div>
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
        ) : (
          resume.status === 'uploaded' && (
            <Card className="shadow-xs border border-border">
              <CardContent className="text-center py-20">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-foreground font-bold text-lg mb-2">Resume Uploaded</p>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  Your resume file has been successfully uploaded and is ready for scoring. Let AI analyze it across key categories.
                </p>
                <Button onClick={() => analyzeMutation.mutate(resumeId)} disabled={analyzing} size="lg">
                  {analyzing ? (
                    <><Loader2 className="h-4.5 w-4.5 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Briefcase className="h-4.5 w-4.5" /> Analyze Resume</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </PageTransition>
  )
}
