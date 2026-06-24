import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Loader2, AlertCircle, Briefcase, Trash2, Calendar
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { ConfirmModal } from '../components/ui/confirm-modal'
import { useResume, useMatches, useMatchJob, useDeleteMatch } from '../lib/hooks/use-api'

export default function JobMatcher() {
  const { resumeId } = useParams()
  const navigate = useNavigate()

  const [jd, setJd] = useState('')
  const [matchError, setMatchError] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [matchToDelete, setMatchToDelete] = useState(null)

  const { data: resumeData, isLoading: loading, error } = useResume(resumeId)
  const { data: matchesData, isLoading: matchesLoading } = useMatches(resumeId)
  const matchJobMutation = useMatchJob()
  const deleteMatchMutation = useDeleteMatch()

  const resume = resumeData?.resume
  const matches = matchesData?.matches || []
  const matching = matchJobMutation.isPending
  const deletingId = deleteMatchMutation.variables?.matchId

  const handleMatchJd = () => {
    if (!jd.trim()) return
    setMatchError('')
    matchJobMutation.mutate({ id: resumeId, jd: jd.trim() }, {
      onSuccess: (data) => {
        setSelectedMatch(data.match)
        setJd('')
      },
      onError: (err) => {
        setMatchError(err.message)
      },
    })
  }

  const promptDeleteMatch = (matchItem, e) => {
    e.stopPropagation()
    setMatchToDelete(matchItem)
  }

  const handleConfirmDeleteMatch = () => {
    if (!matchToDelete) return
    deleteMatchMutation.mutate(
      { resumeId, matchId: matchToDelete._id },
      {
        onSuccess: () => {
          if (selectedMatch?._id === matchToDelete._id) {
            const remaining = matches.filter(m => m._id !== matchToDelete._id)
            setSelectedMatch(remaining[0] || null)
          }
          setMatchToDelete(null)
        },
      }
    )
  }

  if (loading) {
    return (
      <div className="w-full space-y-6 pt-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
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
          <p className="font-bold text-lg text-foreground mb-1">Error Loading Page</p>
          <p className="text-sm">{error?.message || 'Resume not found'}</p>
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
          activeTab="jd"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Form & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Run Matcher Card */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="h-4.5 w-4.5 text-primary" />
                  New Compatibility Match
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  placeholder="Paste target job description here..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-border bg-secondary/25 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 resize-none font-sans leading-relaxed text-foreground"
                  disabled={matching}
                />

                {matchError && (
                  <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-semibold flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{matchError}</span>
                  </div>
                )}

                <Button
                  onClick={handleMatchJd}
                  disabled={matching || !jd.trim()}
                  className="w-full shadow-md shadow-primary/10 text-xs py-2 h-9"
                >
                  {matching ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Matching...</>
                  ) : (
                    <><Briefcase className="h-3.5 w-3.5" /> Match Compatibility</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* History List */}
            <Card className="border border-border overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-bold">Match History ({matches.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/60 max-h-96 overflow-y-auto scrollbar-none">
                {matches.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No matching runs saved yet. Paste a JD above to run your first match.
                  </div>
                ) : (
                  matches.map((item) => {
                    const isSelected = selectedMatch?._id === item._id
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedMatch(item)}
                        className={`px-6 py-3 text-left transition-colors cursor-pointer flex justify-between items-center gap-2 hover:bg-secondary/15 ${isSelected ? 'bg-secondary/25 border-l-2 border-primary' : ''
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-black ${item.matchPercentage >= 80 ? 'text-emerald-500' : item.matchPercentage >= 50 ? 'text-amber-500' : 'text-destructive'
                              }`}>
                              {Math.round(item.matchPercentage)}%
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-1">
                            {item.jd}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                          disabled={deletingId === item._id}
                          onClick={(e) => promptDeleteMatch(item, e)}
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Match Details */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedMatch ? (
                <motion.div
                  key={selectedMatch._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Score & Verdict Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                    <Card className="border border-border flex flex-col justify-center items-center p-6 text-center">
                      <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3">Overall Match</div>
                      <div className="relative flex items-center justify-center">
                        <svg className="w-28 h-28 transform -rotate-90">
                          <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="6" className="text-secondary" fill="transparent" />
                          <circle
                            cx="56"
                            cy="56"
                            r="46"
                            stroke="currentColor"
                            strokeWidth="6"
                            className={selectedMatch.matchPercentage >= 80 ? 'text-emerald-500' : selectedMatch.matchPercentage >= 50 ? 'text-amber-500' : 'text-destructive'}
                            fill="transparent"
                            strokeDasharray={289}
                            strokeDashoffset={289 - (289 * selectedMatch.matchPercentage) / 100}
                          />
                        </svg>
                        <div className="absolute text-2xl font-black">{Math.round(selectedMatch.matchPercentage)}%</div>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground mt-4">Compatibility Score</p>
                    </Card>

                    <Card className="border border-border md:col-span-2 p-6 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-xs font-extrabold text-primary uppercase tracking-widest">AI Match Evaluation</div>
                        <p className="text-xs font-medium text-foreground leading-relaxed">
                          {selectedMatch.explanation}
                        </p>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-4">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Matched on {new Date(selectedMatch.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </Card>
                  </div>

                  {/* Keywords Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold text-foreground">Matched Keywords</CardTitle>
                        <p className="text-[11px] text-muted-foreground">These terms match the target job profile perfectly.</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMatch.matchedKeywords?.length > 0 ? (
                            selectedMatch.matchedKeywords.map((kw, idx) => (
                              <Badge key={idx} variant="success" className="px-2.5 py-1 text-[11px] font-bold">✓ {kw}</Badge>
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
                        <p className="text-[11px] text-muted-foreground">Add these keywords to pass target filters.</p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedMatch.missingKeywords?.length > 0 ? (
                            selectedMatch.missingKeywords.map((kw, idx) => (
                              <Badge key={idx} variant="destructive" className="px-2.5 py-1 text-[11px] font-bold">+ {kw}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No missing keywords found! Fantastic.</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations */}
                  <Card className="border border-border">
                    <CardHeader>
                      <CardTitle className="text-sm font-bold">Recommendations for Alignment</CardTitle>
                      <p className="text-[11px] text-muted-foreground">Specific advice to custom-tailor your resume for this position.</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedMatch.recommendations?.map((rec, idx) => (
                        <div key={idx} className="flex gap-3 text-xs">
                          <span className="text-primary font-bold">{idx + 1}.</span>
                          <p className="text-foreground/90 leading-relaxed font-semibold">{rec}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* original JD preview */}
                  <Card className="border border-border bg-secondary/5">
                    <CardHeader className="py-3">
                      <CardTitle className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Matched Job Description</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto scrollbar-none font-mono">
                        {selectedMatch.jd}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                  <h3 className="font-bold text-foreground text-sm mb-1">No Match Results Selected</h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Compare your resume with a job posting by entering the job description on the left.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={matchToDelete !== null}
        onClose={() => setMatchToDelete(null)}
        onConfirm={handleConfirmDeleteMatch}
        title="Delete Match Result?"
        description={`Are you sure you want to delete the compatibility match run with a score of ${matchToDelete ? Math.round(matchToDelete.matchPercentage) : 0}% from ${matchToDelete ? new Date(matchToDelete.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Permanently"
        confirmVariant="destructive"
        isConfirming={deletingId === matchToDelete?._id}
      />
    </PageTransition>
  )
}
