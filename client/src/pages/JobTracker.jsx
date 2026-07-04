import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import {
  Loader2, Plus, Trash2, ExternalLink, Calendar, AlertCircle
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import {
  useResume, useJobApplications, useCreateJobApplication,
  useUpdateJobApplication, useDeleteJobApplication
} from '../lib/hooks/use-api'

const stages = [
  { value: 'saved', label: 'Saved', color: 'bg-gray-500' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { value: 'phone_screen', label: 'Phone Screen', color: 'bg-indigo-500' },
  { value: 'interview', label: 'Interview', color: 'bg-amber-500' },
  { value: 'offer', label: 'Offer', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-600' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-400' },
]

export default function JobTracker() {
  const { resumeId } = useParams()
  const { data: resumeData, isLoading } = useResume(resumeId)
  const { data: appsData, isLoading: appsLoading } = useJobApplications(resumeId)
  const createMutation = useCreateJobApplication()
  const updateMutation = useUpdateJobApplication()
  const deleteMutation = useDeleteJobApplication()

  const resume = resumeData?.resume
  const applications = appsData?.applications || []

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ company: '', jobTitle: '', jobUrl: '', location: '', salaryRange: '', notes: '' })
  const [formError, setFormError] = useState('')

  const handleCreate = () => {
    if (!form.company.trim() || !form.jobTitle.trim()) {
      setFormError('Company and Job Title are required')
      return
    }
    setFormError('')
    createMutation.mutate({ id: resumeId, ...form }, {
      onSuccess: () => {
        setForm({ company: '', jobTitle: '', jobUrl: '', location: '', salaryRange: '', notes: '' })
        setShowForm(false)
      },
      onError: (err) => setFormError(err.message),
    })
  }

  const handleStageChange = (app, newStage) => {
    updateMutation.mutate({
      resumeId,
      appId: app._id,
      stage: newStage,
      ...(newStage === 'applied' && !app.appliedDate ? { appliedDate: new Date().toISOString() } : {}),
      ...(newStage === 'interview' && !app.interviewDate ? { interviewDate: new Date().toISOString() } : {}),
    })
  }

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
    <PageTransition>
      <div className="w-full space-y-6 pt-4">
        <AnalysisNavigation resume={resume} resumeId={resumeId} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="h-5 w-5 text-cyan-500" />
                Job Application Tracker
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track applications across stages with AI-powered insights.
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Application
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Form */}
            {showForm && (
              <Card className="border border-cyan-500/30 bg-cyan-500/5">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Company *"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                    <input
                      value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                      placeholder="Job Title *"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                    <input
                      value={form.jobUrl}
                      onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                      placeholder="Job URL"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Location"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                    <input
                      value={form.salaryRange}
                      onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
                      placeholder="Salary Range"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                    <input
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Notes"
                      className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                    />
                  </div>
                  {formError && (
                    <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleCreate} disabled={createMutation.isPending} size="sm">
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Kanban Board */}
            {appsLoading ? (
              <Skeleton className="h-64" />
            ) : applications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No applications yet. Add your first job application to start tracking.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stages.slice(0, 4).map((stage) => {
                  const stageApps = applications.filter((a) => a.stage === stage.value)
                  const laterApps = applications.filter((a) => !stages.slice(0, 4).some((s) => s.value === a.stage))
                  if (stage.value === stages[3].value) {
                    return (
                      <div key={stage.value}>
                        <div className={`${stage.color} text-white text-xs font-bold px-3 py-1.5 rounded-t-xl flex items-center justify-between`}>
                          <span>{stage.label}</span>
                          <span>{stageApps.length + laterApps.filter((a) => ['offer', 'rejected', 'accepted', 'withdrawn'].includes(a.stage)).length}</span>
                        </div>
                        <div className="space-y-2 bg-secondary/20 p-2 rounded-b-xl min-h-[200px] border border-t-0 border-border/50">
                          {stageApps.map((app) => (
                            <AppCard key={app._id} app={app} stages={stages} onStageChange={handleStageChange} onDelete={(id) => deleteMutation.mutate({ resumeId, appId: id })} />
                          ))}
                          {laterApps.filter((a) => ['offer', 'rejected', 'accepted', 'withdrawn'].includes(a.stage)).map((app) => (
                            <AppCard key={app._id} app={app} stages={stages} onStageChange={handleStageChange} onDelete={(id) => deleteMutation.mutate({ resumeId, appId: id })} />
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={stage.value}>
                      <div className={`${stage.color} text-white text-xs font-bold px-3 py-1.5 rounded-t-xl flex items-center justify-between`}>
                        <span>{stage.label}</span>
                        <span>{stageApps.length}</span>
                      </div>
                      <div className="space-y-2 bg-secondary/20 p-2 rounded-b-xl min-h-[200px] border border-t-0 border-border/50">
                        {stageApps.map((app) => (
                          <AppCard key={app._id} app={app} stages={stages} onStageChange={handleStageChange} onDelete={(id) => deleteMutation.mutate({ resumeId, appId: id })} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}

function AppCard({ app, stages, onStageChange, onDelete }) {
  const stage = stages.find((s) => s.value === app.stage)

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{app.jobTitle}</p>
            <p className="text-xs text-muted-foreground">{app.company}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            {app.jobUrl && (
              <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button onClick={() => onDelete(app._id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {app.location && <p className="text-xs text-muted-foreground">{app.location}</p>}
        <div className="flex items-center justify-between pt-1">
          <Badge variant="outline" className="text-[10px]">{stage?.label}</Badge>
          <select
            value={app.stage}
            onChange={(e) => onStageChange(app, e.target.value)}
            className="text-[10px] rounded-lg border border-border bg-background px-1.5 py-0.5"
          >
            {stages.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        {app.aiInsights?.callbackLikelihood && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>Callback: </span>
            <Badge variant={app.aiInsights.callbackLikelihood === 'high' ? 'secondary' : app.aiInsights.callbackLikelihood === 'medium' ? 'outline' : 'destructive'} className="text-[10px]">
              {app.aiInsights.callbackLikelihood}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
