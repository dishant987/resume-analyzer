import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, AlertCircle, Mail, Trash2, Calendar, Copy, Check, FileDown
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { ConfirmModal } from '../components/ui/confirm-modal'
import { useResume, useCoverLetters, useGenerateCoverLetter, useDeleteCoverLetter } from '../lib/hooks/use-api'

export default function CoverLetter() {
  const { resumeId } = useParams()
  const navigate = useNavigate()

  const [jd, setJd] = useState('')
  const [genError, setGenError] = useState('')
  const [selectedLetter, setSelectedLetter] = useState(null)
  const [copied, setCopied] = useState(false)
  const [fontStyle, setFontStyle] = useState('serif')
  const [letterToDelete, setLetterToDelete] = useState(null)

  const { data: resumeData, isLoading: loading, error } = useResume(resumeId)
  const { data: lettersData } = useCoverLetters(resumeId)
  const generateMutation = useGenerateCoverLetter()
  const deleteMutation = useDeleteCoverLetter()

  const resume = resumeData?.resume
  const letters = lettersData?.coverLetters || []
  const generating = generateMutation.isPending
  const deletingId = deleteMutation.variables?.letterId

  const handleGenerate = () => {
    if (!jd.trim()) return
    setGenError('')
    generateMutation.mutate({ id: resumeId, jd: jd.trim() }, {
      onSuccess: (data) => {
        setSelectedLetter(data.coverLetter)
        setJd('')
      },
      onError: (err) => {
        setGenError(err.message)
      },
    })
  }

  const promptDeleteLetter = (letterItem, e) => {
    e.stopPropagation()
    setLetterToDelete(letterItem)
  }

  const handleConfirmDeleteLetter = () => {
    if (!letterToDelete) return
    deleteMutation.mutate(
      { resumeId, letterId: letterToDelete._id },
      {
        onSuccess: () => {
          if (selectedLetter?._id === letterToDelete._id) {
            const remaining = letters.filter(l => l._id !== letterToDelete._id)
            setSelectedLetter(remaining[0] || null)
          }
          setLetterToDelete(null)
        },
      }
    )
  }

  const handleCopy = () => {
    if (!selectedLetter) return
    navigator.clipboard.writeText(selectedLetter.coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!selectedLetter || !resume) return
    const element = document.createElement("a");
    const file = new Blob([selectedLetter.coverLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `cover-letter-${resume.originalFilename.replace(/\.[^.]+$/, '')}-${new Date(selectedLetter.createdAt).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
          activeTab="cover-letter"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Form & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generator Card */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-primary" />
                  New Cover Letter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  placeholder="Paste Job Description for target cover letter here..."
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-border bg-secondary/25 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 resize-none font-sans leading-relaxed text-foreground"
                  disabled={generating}
                />

                {genError && (
                  <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-semibold flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{genError}</span>
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !jd.trim()}
                  className="w-full shadow-md shadow-primary/10 text-xs py-2 h-9"
                >
                  {generating ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Drafting...</>
                  ) : (
                    <><Mail className="h-3.5 w-3.5" /> Generate Letter</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* History List */}
            <Card className="border border-border overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-bold">Generated Letters ({letters.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/60 max-h-96 overflow-y-auto scrollbar-none">
                {letters.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No letters saved. Generate a cover letter to build your list.
                  </div>
                ) : (
                  letters.map((item) => {
                    const isSelected = selectedLetter?._id === item._id
                    return (
                      <div
                        key={item._id}
                        onClick={() => setSelectedLetter(item)}
                        className={`px-6 py-3 text-left transition-colors cursor-pointer flex justify-between items-center gap-2 hover:bg-secondary/15 ${isSelected ? 'bg-secondary/25 border-l-2 border-primary' : ''
                          }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <p className="text-[11px] font-semibold text-foreground truncate mt-1">
                            {item.jd}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                          disabled={deletingId === item._id}
                          onClick={(e) => promptDeleteLetter(item, e)}
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

          {/* Right Column: Letter Display */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedLetter ? (
                <motion.div
                  key={selectedLetter._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <Card className="border border-border bg-card overflow-hidden shadow-md">
                    <div className="flex items-center justify-between border-b border-border bg-secondary/15 px-6 py-3.5 flex-wrap gap-3">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                          Tailored Cover Letter
                        </span>

                        {/* Font Selector */}
                        <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/40">
                          <button
                            onClick={() => setFontStyle('serif')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${fontStyle === 'serif' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            Serif
                          </button>
                          <button
                            onClick={() => setFontStyle('sans')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${fontStyle === 'sans' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            Sans
                          </button>
                          <button
                            onClick={() => setFontStyle('mono')}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${fontStyle === 'mono' ? 'bg-background text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                              }`}
                          >
                            Mono
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          className="gap-1.5 h-8 text-xs px-3"
                        >
                          {copied ? (
                            <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Copy Text</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="gap-1.5 h-8 text-xs px-3"
                        >
                          <FileDown className="h-3.5 w-3.5" /> Download TXT
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-8 md:p-12 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-[500px] shadow-inner relative border-t border-border">
                      {/* Decorative colored strip to mimic binder/paperhead */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500" />
                      <textarea
                        value={selectedLetter.coverLetter}
                        onChange={(e) => setSelectedLetter({ ...selectedLetter, coverLetter: e.target.value })}
                        className={`w-full h-full min-h-[450px] bg-transparent border-0 focus:outline-none resize-y leading-relaxed whitespace-pre-wrap focus:ring-0 ${fontStyle === 'serif' ? 'font-serif text-[13px] tracking-wide' :
                            fontStyle === 'mono' ? 'font-mono text-xs tracking-tight' : 'font-sans text-[13px]'
                          }`}
                        placeholder="Start typing your cover letter here..."
                      />
                    </CardContent>
                  </Card>

                  {/* original JD preview */}
                  <Card className="border border-border bg-secondary/5">
                    <CardHeader className="py-2.5">
                      <CardTitle className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Target Job Description</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto scrollbar-none font-mono">
                        {selectedLetter.jd}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                  <h3 className="font-bold text-foreground text-sm mb-1">No Cover Letter Selected</h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Generate a new cover letter by entering the job details on the left.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={letterToDelete !== null}
        onClose={() => setLetterToDelete(null)}
        onConfirm={handleConfirmDeleteLetter}
        title="Delete Cover Letter?"
        description={`Are you sure you want to delete the cover letter created on ${letterToDelete ? new Date(letterToDelete.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Permanently"
        confirmVariant="destructive"
        isConfirming={deletingId === letterToDelete?._id}
      />
    </PageTransition>
  )
}
