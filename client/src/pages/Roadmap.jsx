import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, AlertCircle, CheckCircle2,
  Compass, ArrowLeft, ChevronRight, Bookmark, BookOpen, Layers, Trash2, Calendar, Video
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'

const Youtube = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.522 3.536 12 3.536 12 3.536s-7.522 0-9.388.52A3.002 3.002 0 0 0 .502 6.163C0 8.03 0 12 0 12s0 3.97.502 5.837a3.002 3.002 0 0 0 2.11 2.107c1.866.52 9.388.52 9.388.52s7.522 0 9.388-.52a3.002 3.002 0 0 0 2.11-2.107C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

function DeleteConfirmModal({ isOpen, onClose, onConfirm, targetRole, roadmapDate, isDeleting }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6 overflow-hidden z-10"
          >
            {/* Warning Icon & Title */}
            <div className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground tracking-tight">Delete Roadmap</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Are you sure you want to delete this career roadmap? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Details panel */}
            <div className="p-3.5 bg-secondary/25 border border-border/60 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Target Role</span>
                <span className="text-foreground font-bold">{targetRole}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Generated On</span>
                <span className="text-foreground font-bold">{roadmapDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-xs font-bold text-muted-foreground cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                className="text-xs font-bold cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Deleting...
                  </span>
                ) : (
                  'Confirm Delete'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function Roadmap() {
  const { resumeId } = useParams()
  const navigate = useNavigate()

  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [targetRole, setTargetRole] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [roadmaps, setRoadmaps] = useState([])
  const [selectedRoadmap, setSelectedRoadmap] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [roadmapToDelete, setRoadmapToDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [resResume, resRoadmap] = await Promise.all([
        fetch(`/api/resumes/${resumeId}`, { credentials: 'include' }).then((r) => {
          if (!r.ok) throw new Error('Failed to load resume details')
          return r.json()
        }),
        fetch(`/api/resumes/${resumeId}/roadmap`, { credentials: 'include' }).then((r) => {
          if (!r.ok) throw new Error('Failed to load roadmap data')
          return r.json()
        })
      ])
      setResume(resResume.resume)
      if (resRoadmap.roadmaps) {
        setRoadmaps(resRoadmap.roadmaps)
        if (resRoadmap.roadmaps.length > 0) {
          setSelectedRoadmap(resRoadmap.roadmaps[0])
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [resumeId])

  const handleGenerate = async () => {
    if (!targetRole.trim()) return
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch(`/api/resumes/${resumeId}/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Roadmap generation failed. Please try again.')
      }
      const updated = [data.roadmap, ...roadmaps]
      setRoadmaps(updated)
      setSelectedRoadmap(data.roadmap)
      setTargetRole('')
      setShowNewForm(false)
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const promptDeleteRoadmap = (item, e) => {
    e.stopPropagation()
    setRoadmapToDelete(item)
  }

  const handleConfirmDeleteRoadmap = async () => {
    if (!roadmapToDelete) return
    setDeletingId(roadmapToDelete._id)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/roadmap/${roadmapToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to delete roadmap')
      }
      const filtered = roadmaps.filter(r => r._id !== roadmapToDelete._id)
      setRoadmaps(filtered)
      if (selectedRoadmap?._id === roadmapToDelete._id) {
        setSelectedRoadmap(filtered[0] || null)
      }
      setRoadmapToDelete(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
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
          <p className="text-sm">{error || 'Resume not found'}</p>
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
          activeTab="roadmap"
        />

        {(roadmaps.length === 0 || showNewForm) && !generating ? (
          /* Initial Form State */
          <Card className="max-w-xl mx-auto border border-border mt-10">
            <CardHeader className="text-center pb-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 border border-primary/20">
                <Compass className="h-6 w-6 animate-spin-slow" />
              </div>
              <CardTitle className="text-lg font-bold">What is your next dream career goal?</CardTitle>
              <p className="text-xs text-muted-foreground">Specify the role you want to optimize for (e.g. Senior Frontend Engineer, DevOps specialist, Product Manager).</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g. Senior Fullstack Developer, Product Manager..."
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/20 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/45 font-medium text-foreground"
                />
              </div>

              {genError && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              <div className="flex gap-3">
                {roadmaps.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewForm(false)
                      setTargetRole('')
                      setGenError('')
                    }}
                    className="flex-1 font-bold"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={!targetRole.trim()}
                  className="flex-1 shadow-lg shadow-primary/20 py-5 font-bold"
                >
                  <Compass className="h-4.5 w-4.5 mr-2" />
                  Generate Roadmap & Gaps
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : generating ? (
          /* Loading / Generating state */
          <Card className="max-w-xl mx-auto border border-border mt-10 py-16 text-center">
            <CardContent className="space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <h3 className="font-bold text-foreground text-lg">Analyzing Skill Gaps...</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                ResuLens is comparing your resume skills and history against market demands for a <span className="text-primary font-bold">"{targetRole}"</span> and planning your 6-month roadmap. Please wait.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Roadmap & Gaps View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left side: Fit Score & Skill Gap Checklist */}
            <div className="lg:col-span-1 space-y-6">
              {/* Match Card */}
              {selectedRoadmap && (
                <Card className="border border-border p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300" />
                  <div className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-4">Target Role Fit</div>
                  <div className="relative flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="6" className="text-secondary" fill="transparent" />
                      <circle
                        cx="56"
                        cy="56"
                        r="46"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-primary"
                        fill="transparent"
                        strokeDasharray={289}
                        strokeDashoffset={289 - (289 * (selectedRoadmap.matchPercentage || 0)) / 100}
                      />
                    </svg>
                    <div className="absolute text-2xl font-black">{Math.round(selectedRoadmap.matchPercentage || 0)}%</div>
                  </div>
                  <h3 className="font-extrabold text-sm text-foreground mt-4 truncate max-w-full">
                    {selectedRoadmap.targetRole}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1">Profile Similarity Score</p>

                  {/* Reset button inside Match Card */}
                  <Button
                    onClick={() => setShowNewForm(true)}
                    variant="outline"
                    size="sm"
                    className="mt-5 w-full rounded-xl text-xs font-bold border-border hover:bg-secondary"
                  >
                    Generate New Roadmap
                  </Button>
                </Card>
              )}

              {/* Skills checklist card */}
              {selectedRoadmap && (
                <Card className="border border-border">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-primary" />
                      Skill Gap Checklist
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-5 space-y-5">
                    {/* Gained/Existing Skills */}
                    <div>
                      <div className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500/10" />
                        Acquired Match Skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRoadmap.gainedSkills?.length > 0 ? (
                          selectedRoadmap.gainedSkills.map((sk) => (
                            <Badge key={sk} variant="secondary" className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">
                              {sk}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">None found.</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <div className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 fill-amber-500/10" />
                        Missing Skills to Develop
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRoadmap.missingSkills?.length > 0 ? (
                          selectedRoadmap.missingSkills.map((sk) => (
                            <Badge key={sk} variant="secondary" className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/15">
                              {sk}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-emerald-500 font-bold">You have all core skills! Excellent.</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* History List */}
              <Card className="border border-border overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-bold">Roadmap History ({roadmaps.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/60 max-h-96 overflow-y-auto scrollbar-none">
                  {roadmaps.map((item) => {
                    const isSelected = selectedRoadmap?._id === item._id
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedRoadmap(item)}
                        className={`px-6 py-3 text-left transition-colors cursor-pointer flex justify-between items-center gap-2 hover:bg-secondary/15 ${isSelected ? 'bg-secondary/25 border-l-2 border-primary' : ''
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-primary">
                              {Math.round(item.matchPercentage || 0)}%
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-1">
                            {item.targetRole}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                          disabled={deletingId === item._id}
                          onClick={(e) => promptDeleteRoadmap(item, e)}
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Right side: 6-Month Roadmap Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {selectedRoadmap ? (
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Compass className="h-5 w-5 text-primary" />
                      6-Month Growth Roadmap
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Cronological timeline customized to develop your missing skills and prepare for roles.</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="relative border-l border-border pl-6 space-y-8">
                      {selectedRoadmap.roadmap?.map((phase, idx) => (
                        <div key={idx} className="relative group">
                          {/* Timeline Circle */}
                          <div className="absolute -left-[31px] top-1.5 h-4.5 w-4.5 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 group-hover:bg-primary transition-colors duration-200">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:bg-background" />
                          </div>

                          {/* Phase Content */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold font-mono tracking-wider bg-secondary px-2.5 py-1 rounded border border-border/50 uppercase text-primary">
                                {phase.phase} ({phase.duration})
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-foreground tracking-tight leading-none mt-1">
                              Focus: {phase.focus}
                            </h4>

                            {/* Tasks */}
                            {phase.tasks?.length > 0 && (
                              <div className="space-y-1.5 mt-2">
                                <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                  <Bookmark className="h-3 w-3" /> Key Action Steps
                                </div>
                                <ul className="list-disc list-inside text-xs text-muted-foreground pl-1 space-y-1 leading-relaxed">
                                  {phase.tasks.map((task, tIdx) => (
                                    <li key={tIdx}>{task}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Projects */}
                            {phase.projects?.length > 0 && (
                              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 mt-3 space-y-1.5">
                                <div className="text-[9px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1">
                                  <Compass className="h-3 w-3" /> Suggested Project
                                </div>
                                <ul className="text-xs text-foreground/90 font-medium pl-1 list-disc list-inside space-y-0.5">
                                  {phase.projects.map((proj, pIdx) => (
                                    <li key={pIdx}>{proj}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Resources */}
                            {phase.resources?.length > 0 && (
                              <div className="space-y-1 mt-3">
                                <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" /> Recommended Topics & Resources
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                                  {phase.resources.map((res, rIdx) => {
                                    const isObject = typeof res === 'object' && res !== null && res.label && res.url
                                    const label = isObject ? res.label : res
                                    const url = isObject ? res.url : null

                                    if (url) {
                                      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be')
                                      return (
                                        <a
                                          key={rIdx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`text-[10px] font-bold px-2.5 py-1 rounded border transition-all inline-flex items-center gap-1 cursor-pointer select-none ${isYoutube
                                              ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border-red-500/20 hover:border-red-500/35'
                                              : 'text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/35'
                                            }`}
                                        >
                                          {isYoutube && <Youtube className="h-3 w-3 shrink-0" />}
                                          {label}
                                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                        </a>
                                      )
                                    }

                                    return (
                                      <span key={rIdx} className="text-[10px] font-bold text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded border border-border/40">
                                        {label}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                  <Compass className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                  <h3 className="font-bold text-foreground text-sm mb-1">No Career Roadmap Selected</h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Select a career roadmap from the history sidebar or generate a new one to get started.
                  </p>
                </Card>
              )}
            </div>

          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={roadmapToDelete !== null}
        onClose={() => setRoadmapToDelete(null)}
        onConfirm={handleConfirmDeleteRoadmap}
        targetRole={roadmapToDelete?.targetRole || ''}
        roadmapDate={roadmapToDelete ? new Date(roadmapToDelete.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
        isDeleting={deletingId === roadmapToDelete?._id}
      />
    </PageTransition>
  )
}
