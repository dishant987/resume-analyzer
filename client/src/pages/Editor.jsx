import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, Check, X, ArrowLeft, Download, Save,
  AlignLeft, Briefcase, FolderGit2, Wrench, GraduationCap, Edit3, Trash2
} from 'lucide-react'
import { useResume, useVersions, useFixResume, useSaveVersion } from '../lib/hooks/use-api'

const sections = [
  { key: 'summary', label: 'Summary', icon: AlignLeft },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'projects', label: 'Projects', icon: FolderGit2 },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'education', label: 'Education', icon: GraduationCap },
]

export default function Editor() {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const [improvement, setImprovement] = useState(null)
  const [version, setVersion] = useState(null)
  const [accepted, setAccepted] = useState({})
  const [showExport, setShowExport] = useState(false)
  const [editing, setEditing] = useState({})

  const { data: resumeData, isLoading: loading } = useResume(resumeId)
  const { data: versionsData } = useVersions(resumeId)
  const fixMutation = useFixResume()
  const saveMutation = useSaveVersion()
  const saving = saveMutation.isPending

  const resume = resumeData?.resume

  useEffect(() => {
    const v = versionsData?.versions?.[0]
    if (v && !improvement) {
      setVersion(v)
      setImprovement({
        summary: v.content.summary,
        experience: splitLines(v.content.experience),
        projects: splitLines(v.content.projects),
        skills: v.content.skills.split(', '),
        education: v.content.education,
      })
    }
  }, [versionsData])

  const splitLines = (text) => text?.split('\n\n').filter(Boolean) || []

  const getSectionTextForEditing = (key) => {
    const content = improvement?.[key]
    if (!content) return ''
    if (key === 'skills') {
      return Array.isArray(content) ? content.join(', ') : content
    }
    if (Array.isArray(content)) {
      return content.map(item => typeof item === 'string' ? item : item.improved).join('\n\n')
    }
    return content
  }

  const saveEditedSection = (key, val) => {
    let updatedVal
    if (key === 'skills') {
      updatedVal = val.split(',').map(s => s.trim()).filter(Boolean)
    } else if (key === 'experience' || key === 'projects') {
      updatedVal = val.split('\n\n').map(s => s.trim()).filter(Boolean)
    } else {
      updatedVal = val
    }
    setImprovement(prev => ({
      ...prev,
      [key]: updatedVal
    }))
    setAccepted(prev => ({
      ...prev,
      [key]: true
    }))
    setEditing(prev => ({
      ...prev,
      [key]: false
    }))
  }

  const handleFix = () => {
    fixMutation.mutate(resumeId, {
      onSuccess: (data) => {
        setImprovement(data.improvement)
        setVersion(data.version)
        const all = {}
        Object.keys(data.improvement).forEach((k) => { all[k] = true })
        setAccepted(all)
      },
    })
  }

  const toggleAccept = (section) => {
    setAccepted((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const downloadFile = (format) => {
    window.open(`/api/resumes/${resumeId}/export/${format}`, '_blank')
  }

  const handleSave = async () => {
    const content = {}
    sections.forEach(({ key }) => {
      const isAccepted = accepted[key]
      if (!isAccepted) {
        if (key === 'skills') {
          content[key] = resume?.rawText?.split('Skills').pop()?.slice(0, 200) || ''
        } else if (key === 'experience' || key === 'projects') {
          const items = improvement?.[key]
          if (Array.isArray(items)) {
            content[key] = items.map(item => typeof item === 'string' ? item : item.original).join('\n\n')
          } else {
            content[key] = ''
          }
        } else if (key === 'summary') {
          content[key] = resume?.rawText?.slice(0, 300) || ''
        } else {
          content[key] = ''
        }
      } else {
        if (key === 'skills') {
          content[key] = improvement?.skills?.join(', ') || ''
        } else if (key === 'experience' || key === 'projects') {
          const items = improvement?.[key]
          content[key] = Array.isArray(items)
            ? items.map((i) => (typeof i === 'string' ? i : i.improved)).join('\n\n')
            : items || ''
        } else {
          content[key] = improvement?.[key] || ''
        }
      }
    })
    try {
      await saveMutation.mutateAsync({ id: resumeId, content, source: 'user_edited', versionNumber: (version?.versionNumber || 0) + 1 })
      navigate(`/analysis/${resumeId}`)
    } catch {}
  }

  const renderContent = (key, content) => {
    if (!content) return <span className="text-muted-foreground italic">No recommendations generated.</span>
    if (key === 'skills') {
      const list = Array.isArray(content) ? content : content.split(', ')
      return (
        <div className="flex flex-wrap gap-2">
          {list.map((skill, i) => (
            <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs">{skill}</Badge>
          ))}
        </div>
      )
    }
    if (Array.isArray(content)) {
      return content.map((item, i) => {
        const isString = typeof item === 'string'
        return (
          <div key={i} className="mb-4 last:mb-0 p-3 rounded-xl border border-border bg-secondary/10">
            {isString ? (
              <p className="text-sm leading-relaxed text-foreground">{item}</p>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs text-rose-600 dark:text-rose-400 line-through leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-[9px] mr-2 text-rose-500/70">Original:</span>
                  {item.original}
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-sm text-foreground leading-relaxed">
                  <span className="font-bold uppercase tracking-wider text-[9px] mr-2 text-emerald-500/70">Optimized:</span>
                  {item.improved}
                </div>
              </div>
            )}
          </div>
        )
      })
    }
    return <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{content}</p>
  }

  const renderDiffBlock = (sectionKey, label, Icon) => {
    const oldText = sectionKey === 'skills' ? resume?.rawText?.split('Skills').pop()?.slice(0, 200) : ''
    const newContent = improvement?.[sectionKey]
    const isAccepted = accepted[sectionKey]
    const isEditing = editing[sectionKey]

    return (
      <motion.div
        key={sectionKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Card className={`transition-all duration-200 border ${isAccepted ? 'border-emerald-500/40 ring-1 ring-emerald-500/10' : 'border-border'}`}>
          <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${isAccepted ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500' : 'border-border bg-secondary/30 text-muted-foreground'}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-bold" id={`section-${sectionKey}-title`}>{label}</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
                className="gap-1.5 h-9"
              >
                <Edit3 className="h-4 w-4" /> {isEditing ? 'Cancel' : 'Edit'}
              </Button>

              <Button
                variant={isAccepted ? 'success' : 'outline'}
                size="sm"
                onClick={() => toggleAccept(sectionKey)}
                className="gap-1.5 h-9"
                aria-label={`${isAccepted ? 'Accepted' : 'Reject'} ${label} section`}
                aria-pressed={isAccepted}
              >
                {isAccepted ? (
                  <><Check className="h-4 w-4" aria-hidden="true" /> Accepted</>
                ) : (
                  <><X className="h-4 w-4" aria-hidden="true" /> Rejected</>
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-5 sm:p-6">
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  id={`edit-textarea-${sectionKey}`}
                  defaultValue={getSectionTextForEditing(sectionKey)}
                  className="w-full min-h-[160px] p-4 rounded-xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  placeholder={`Edit your optimized ${label}...`}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(prev => ({ ...prev, [sectionKey]: false }))}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      const val = document.getElementById(`edit-textarea-${sectionKey}`).value
                      saveEditedSection(sectionKey, val)
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Original */}
                <div className="rounded-xl border border-border bg-secondary/20 p-5">
                  <div className="text-[10px] font-extrabold text-muted-foreground mb-3 uppercase tracking-wider">Original Text</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {sectionKey === 'skills' ? 'Original resume skills list.' : 
                     sectionKey === 'summary' ? (resume?.rawText?.slice(0, 300) + '...') :
                     (oldText || 'Original content parsed.')}
                  </div>
                </div>
                
                {/* Improved */}
                <div className={`rounded-xl border p-5 transition-colors duration-200 ${isAccepted ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-secondary/20'}`}>
                  <div className={`text-[10px] font-extrabold mb-3 uppercase tracking-wider ${isAccepted ? 'text-emerald-500' : 'text-muted-foreground'}`}>Optimized AI Text</div>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-medium">
                    {renderContent(sectionKey, newContent)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="w-full space-y-6 pt-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="w-full pb-32 pt-2">
        
        {/* Back button */}
        <button
          onClick={() => navigate(`/analysis/${resumeId}`)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to analysis
        </button>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Resume Editor</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Review side-by-side improvements. Accept suggestions to prepare exports.</p>
          </div>
          
          {!improvement && (
            <div className="flex gap-2">
              <Button onClick={handleFix} disabled={fixMutation.isPending} size="lg" className="w-full sm:w-auto shadow-md shadow-primary/15">
                {fixMutation.isPending ? (
                  <><Loader2 className="h-4.5 w-4.5 animate-spin" /> Rewriting sections...</>
                ) : (
                  <><Edit3 className="h-4.5 w-4.5" /> Run AI Rewriter</>
                )}
              </Button>
            </div>
          )}
        </div>

        {improvement ? (
          <div className="space-y-6">
            {sections.map(({ key, label, icon }) => renderDiffBlock(key, label, icon))}
          </div>
        ) : (
          <Card className="shadow-xs border border-border">
            <CardContent className="text-center py-20">
              <Edit3 className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-foreground font-bold text-lg mb-2">Improve Wording & Structure</p>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Our model will rewrite your summary, experience points, education headers, and project details to ensure high keyword match density.
              </p>
              <Button onClick={handleFix} disabled={fixMutation.isPending} size="lg">
                {fixMutation.isPending ? (
                  <><Loader2 className="h-4.5 w-4.5 animate-spin" /> Improving...</>
                ) : (
                  <><Edit3 className="h-4.5 w-4.5" /> Fix My Resume</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sticky save bar */}
        {improvement && (
          <div className="fixed bottom-0 left-0 right-0 md:left-64 border-t border-border bg-card/95 backdrop-blur-md p-4 flex items-center justify-center gap-4 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <Button variant="outline" onClick={() => setShowExport(true)} className="gap-2 shrink-0">
              <Download className="h-4.5 w-4.5" /> Export
            </Button>
            <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2 shadow-md shadow-primary/15 min-w-[180px]">
              {saving ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
              {saving ? 'Saving changes...' : 'Save & Continue'}
            </Button>
          </div>
        )}

        {/* Export modal */}
        <AnimatePresence>
          {showExport && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50"
                onClick={() => setShowExport(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-md shadow-2xl border border-border bg-card">
                  <div className="p-6 border-b border-border/50">
                    <CardTitle className="text-xl font-bold">Export Resume</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Download your optimized resume in PDF or Word format.</p>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {version && (
                      <div className="rounded-xl border border-border bg-secondary/30 p-4">
                        <p className="text-xs font-extrabold text-muted-foreground mb-1 uppercase">Summary Preview</p>
                        <p className="text-xs text-foreground line-clamp-3 leading-relaxed">{version.content.summary}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Button className="w-full gap-2 text-sm shadow-sm" variant="default" onClick={() => downloadFile('pdf')}>
                        <Download className="h-4.5 w-4.5" /> Download PDF Document
                      </Button>
                      <Button className="w-full gap-2 text-sm" variant="outline" onClick={() => downloadFile('docx')}>
                        <Download className="h-4.5 w-4.5" /> Download Word (DOCX)
                      </Button>
                    </div>

                    <Button className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground mt-2" variant="ghost" onClick={() => setShowExport(false)}>
                      Close Panel
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
