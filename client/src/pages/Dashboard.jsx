import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Input } from '../components/ui/input'
import {
  Upload, FileText, Clock, ArrowRight, Search, Trash2, ChevronLeft, ChevronRight, AlertCircle,
  TrendingUp, Shield, BarChart3, CheckCircle, RefreshCcw, Award, Loader2
} from 'lucide-react'
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const statusBadge = {
  uploaded: { label: 'Uploaded', variant: 'secondary' },
  analyzed: { label: 'Analyzed', variant: 'success' },
  improved: { label: 'Improved', variant: 'accent' },
  failed: { label: 'Failed', variant: 'destructive' },
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, resumeName, isDeleting }) {
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
                <h3 className="text-lg font-bold text-foreground">Delete Resume?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-foreground break-all">"{resumeName}"</span>?
                  This action is permanent and all associated analytics data will be lost.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={isDeleting}
                className="rounded-full flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}


export default function Dashboard() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [deleting, setDeleting] = useState(null)

  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [activeTab, setActiveTab] = useState('list')

  const fetchResumes = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: '10' })
    if (search.trim()) params.set('search', search.trim())
    fetch(`/api/resumes?${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setList(data.resumes ?? [])
        setPagination(data.pagination || { page: 1, pages: 1, total: 0, limit: 10 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchStats = () => {
    setLoadingStats(true)
    fetch('/api/resumes/analytics/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoadingStats(false))
  }

  useEffect(() => {
    fetchResumes()
  }, [page])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchResumes()
  }

  const [resumeToDelete, setResumeToDelete] = useState(null)

  const promptDelete = (resume, e) => {
    e.stopPropagation()
    setResumeToDelete(resume)
  }

  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return
    setDeleting(resumeToDelete._id)
    try {
      await fetch(`/api/resumes/${resumeToDelete._id}`, { method: 'DELETE', credentials: 'include' })
      fetchResumes()
      fetchStats()
      setResumeToDelete(null)
    } catch {} finally {
      setDeleting(null)
    }
  }

  const scoreData = stats ? [
    { subject: 'ATS Optimization', score: stats.averageScores.atsScore || 0, fullMark: 100 },
    { subject: 'Grammar & Clarity', score: stats.averageScores.grammarScore || 0, fullMark: 100 },
    { subject: 'Skill Alignment', score: stats.averageScores.skillsScore || 0, fullMark: 100 },
    { subject: 'Formatting', score: stats.averageScores.formattingScore || 0, fullMark: 100 },
    { subject: 'Readability', score: stats.averageScores.readabilityScore || 0, fullMark: 100 },
  ] : []

  const statusData = stats ? [
    { name: 'Uploaded Only', count: stats.statusCounts.uploaded || 0, fill: '#64748b' },
    { name: 'ATS Scanned', count: stats.statusCounts.analyzed || 0, fill: '#10b981' },
    { name: 'Optimized', count: stats.statusCounts.improved || 0, fill: '#3b82f6' },
  ] : []

  const lineChartData = stats && stats.recentActivity 
    ? [...stats.recentActivity]
        .reverse()
        .filter(r => r.score !== null)
        .map(r => ({
          name: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          Score: r.score,
          filename: r.filename
        }))
    : []

  const ResumeCard = ({ r }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/analysis/${r._id}`)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{r.originalFilename}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant={statusBadge[r.status]?.variant}>{statusBadge[r.status]?.label}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => promptDelete(r, e)}
            disabled={deleting === r._id}
            className="text-muted-foreground hover:text-destructive shrink-0 h-9 w-9 p-0 rounded-full"
            aria-label={`Delete ${r.originalFilename}`}
          >
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Resumes</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage, analyze, and optimize your uploaded resumes.</p>
          </div>
          <Button onClick={() => navigate('/upload')} className="sm:flex shadow-sm hover:shadow" size="default">
            <Upload className="h-4.5 w-4.5" />
            Upload New
          </Button>
        </div>

        {/* KPI metrics row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="border border-border shadow-xs hover:border-primary/20 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Resumes</p>
                  <h3 className="text-2xl font-black mt-2 text-foreground">{stats.totalResumes}</h3>
                </div>
                <div className="h-11 w-11 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground border border-border/40">
                  <FileText className="h-5.5 w-5.5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs hover:border-primary/20 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ATS Scanned</p>
                  <h3 className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                    {stats.statusCounts.analyzed + stats.statusCounts.improved}
                  </h3>
                </div>
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                  <CheckCircle className="h-5.5 w-5.5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs hover:border-primary/20 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avg ATS Score</p>
                  <h3 className="text-2xl font-black mt-2 text-primary">
                    {stats.averageScores.atsScore > 0 ? `${stats.averageScores.atsScore}%` : '0%'}
                  </h3>
                </div>
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                  <Award className="h-5.5 w-5.5" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-border/50 mb-6 gap-6 relative">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 pb-3.5 font-bold text-sm transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'list' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            Resume Manager
            {activeTab === 'list' && (
              <motion.span
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 pb-3.5 font-bold text-sm transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'analytics' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5" />
            Performance Insights
            {activeTab === 'analytics' && (
              <motion.span
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                placeholder="Search resumes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-4 rounded-full h-11"
              />
            </form>

            {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-xs"><CardContent className="p-5"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : list.length === 0 ? (
          <Card className="shadow-xs border border-border">
            <CardContent className="flex flex-col items-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-semibold text-lg mb-2">
                {search ? 'No search results found' : 'Start optimizing your resume'}
              </p>
              <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
                {search ? 'Try adjusting your search terms or filters.' : 'Upload your resume to get instant scores, keyword analysis, and layout checks.'}
              </p>
              <Button onClick={() => { if (search) { setSearch(''); fetchResumes() } else { navigate('/upload') } }}>
                <Upload className="h-4.5 w-4.5" />
                {search ? 'Clear search' : 'Upload resume'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Desktop table */}
            <Card className="hidden md:block shadow-sm border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">File Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded Date</TableHead>
                    <TableHead className="w-28 text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={r._id} className="cursor-pointer group" onClick={() => navigate(`/analysis/${r._id}`)}>
                      <TableCell className="font-semibold text-foreground pl-6 py-4 flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <span className="truncate max-w-md">{r.originalFilename}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={statusBadge[r.status]?.variant}>{statusBadge[r.status]?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm py-4">
                        {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="pr-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/analysis/${r._id}`)}
                            className="rounded-full h-9 w-9 p-0 hover:bg-secondary"
                            title="View Analysis"
                          >
                            <ArrowRight className="h-4.5 w-4.5 text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => promptDelete(r, e)}
                            disabled={deleting === r._id}
                            className="rounded-full h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile stacked cards */}
            <div className="md:hidden space-y-4">
              {list.map((r) => (
                <ResumeCard key={r._id} r={r} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 pt-6 text-sm text-muted-foreground">
                <span>{pagination.total} resume{pagination.total !== 1 ? 's' : ''} total</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-9 w-9 p-0 rounded-full"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </Button>
                  <span className="font-semibold text-foreground px-1">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page >= pagination.pages}
                    className="h-9 w-9 p-0 rounded-full"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      )}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {loadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-80 w-full rounded-2xl" />
                <Skeleton className="h-80 w-full rounded-2xl" />
                <Skeleton className="h-80 w-full rounded-2xl" />
                <Skeleton className="h-80 w-full rounded-2xl" />
              </div>
            ) : !stats || stats.totalResumes === 0 ? (
              <Card className="border border-border">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                  <p className="font-bold text-foreground">No stats data available yet</p>
                  <p className="text-sm mt-1">Upload and analyze your resumes to populate charts.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Visual Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Radar Chart (ATS criteria scores) */}
                  <Card className="border border-border p-5">
                    <h3 className="text-base font-bold text-foreground mb-4">Average Evaluation Metrics</h3>
                    <div className="h-72 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scoreData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 'bold' }} className="text-muted-foreground" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 9 }} className="text-muted-foreground" />
                          <Radar name="Average Score" dataKey="score" stroke="var(--primary, #1a73e8)" fill="var(--primary, #1a73e8)" fillOpacity={0.3} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Line Chart (Score Improvement Trend) */}
                  <Card className="border border-border p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-foreground">Score Improvement Trend</h3>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>Progress Trend</span>
                        </div>
                      </div>
                      {lineChartData.length < 2 ? (
                        <div className="h-72 w-full flex flex-col items-center justify-center text-center text-muted-foreground">
                          <TrendingUp className="h-10 w-10 mb-3 text-muted-foreground/40 animate-pulse" />
                          <p className="font-bold text-foreground/90 text-sm">More data needed</p>
                          <p className="text-xs max-w-[240px] mt-1">Upload and scan at least 2 resumes to view your score progression trend.</p>
                        </div>
                      ) : (
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f015" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'semibold' }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                                labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="Score" 
                                stroke="var(--primary)" 
                                strokeWidth={3} 
                                activeDot={{ r: 6 }} 
                                dot={{ stroke: 'var(--primary)', strokeWidth: 2, r: 4, fill: 'var(--card)' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Status distribution Bar Chart */}
                  <Card className="border border-border p-5">
                    <h3 className="text-base font-bold text-foreground mb-4">Resumes Optimization Funnel</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'semibold' }} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40} fill="var(--primary)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Optimization Action Items */}
                  <Card className="border border-border p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle className="h-4.5 w-4.5 text-primary" />
                        Recommended Action Items
                      </h3>
                      <div className="space-y-4">
                        {stats.averageScores.atsScore < 85 && (
                          <div className="flex gap-2.5 text-xs">
                            <span className="text-primary font-bold">⚠️</span>
                            <div>
                              <p className="font-bold text-foreground">Optimize ATS Compatibility</p>
                              <p className="text-muted-foreground mt-0.5 leading-normal">Ensure your resume doesn't use complex multi-column layouts, tables, or graphical skills meters.</p>
                            </div>
                          </div>
                        )}
                        {stats.averageScores.skillsScore < 90 && (
                          <div className="flex gap-2.5 text-xs">
                            <span className="text-violet-500 font-bold">🎯</span>
                            <div>
                              <p className="font-bold text-foreground">Expand Technical & Soft Skills</p>
                              <p className="text-muted-foreground mt-0.5 leading-normal">Your average skill score is low. Map key industry terms directly from job postings to raise keyword density.</p>
                            </div>
                          </div>
                        )}
                        {stats.averageScores.grammarScore < 90 && (
                          <div className="flex gap-2.5 text-xs">
                            <span className="text-emerald-500 font-bold">✍️</span>
                            <div>
                              <p className="font-bold text-foreground">Refine Action-Oriented Tone</p>
                              <p className="text-muted-foreground mt-0.5 leading-normal">Avoid passive verb forms. Start every bullet description with strong impact verbs like "Designed" or "Spearheaded".</p>
                            </div>
                          </div>
                        )}
                        {stats.averageScores.formattingScore < 85 && (
                          <div className="flex gap-2.5 text-xs">
                            <span className="text-amber-500 font-bold">📏</span>
                            <div>
                              <p className="font-bold text-foreground">Format Section Dividers</p>
                              <p className="text-muted-foreground mt-0.5 leading-normal">Format headings clearly (e.g., "Work Experience", "Education") to assist automated parsing software.</p>
                            </div>
                          </div>
                        )}
                        {stats.averageScores.atsScore >= 85 && stats.averageScores.skillsScore >= 90 && stats.averageScores.grammarScore >= 90 && (
                          <div className="flex gap-2.5 text-xs">
                            <span className="text-emerald-500 font-bold">🎉</span>
                            <div>
                              <p className="font-bold text-foreground">All Core Metrics Performing Well!</p>
                              <p className="text-muted-foreground mt-0.5 leading-normal">Your resumes are well-structured and rank high on ATS parsing compatibility. Keep matching them to target job descriptions.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Score Summary Metrics */}
                <Card className="border border-border p-6">
                  <h3 className="text-base font-bold text-foreground mb-4">ATS Checklist Performance</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                      { label: 'ATS Score', val: stats.averageScores.atsScore, col: 'text-primary' },
                      { label: 'Grammar', val: stats.averageScores.grammarScore, col: 'text-emerald-500' },
                      { label: 'Skills', val: stats.averageScores.skillsScore, col: 'text-violet-500' },
                      { label: 'Formatting', val: stats.averageScores.formattingScore, col: 'text-amber-500' },
                      { label: 'Readability', val: stats.averageScores.readabilityScore, col: 'text-rose-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="text-center p-4 bg-secondary/20 rounded-2xl border border-border/40">
                        <div className="text-xs font-semibold text-muted-foreground">{item.label}</div>
                        <div className={`text-2xl font-black mt-2 ${item.col}`}>{item.val > 0 ? `${item.val}%` : '0%'}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Scan Activity */}
                {stats.recentActivity && stats.recentActivity.length > 0 && (
                  <Card className="border border-border overflow-hidden">
                    <div className="p-5 border-b border-border/60 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-foreground">Recent Scan Activity</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Logs and scores of your last 5 uploaded resumes.</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">File Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>ATS Score</TableHead>
                            <TableHead>Scan Date</TableHead>
                            <TableHead className="w-28 text-right pr-6"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.recentActivity.map((act) => (
                            <TableRow key={act._id} className="cursor-pointer group" onClick={() => navigate(`/analysis/${act._id}`)}>
                              <TableCell className="font-semibold text-foreground pl-6 py-3.5 flex items-center gap-2.5 text-sm">
                                <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
                                <span className="truncate max-w-sm">{act.filename}</span>
                              </TableCell>
                              <TableCell className="py-3.5">
                                <Badge variant={statusBadge[act.status]?.variant}>{statusBadge[act.status]?.label}</Badge>
                              </TableCell>
                              <TableCell className="py-3.5">
                                {act.score !== null ? (
                                  <span className={`font-extrabold text-sm ${act.score >= 80 ? 'text-emerald-500' : act.score >= 60 ? 'text-amber-500' : 'text-destructive'}`}>
                                    {act.score}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs font-semibold">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs py-3.5">
                                {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell className="pr-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/analysis/${act._id}`)}
                                    className="h-8 rounded-full text-xs font-bold gap-1 hover:bg-secondary"
                                  >
                                    Details
                                    <ArrowRight className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Mobile FAB */}
        <button
          onClick={() => navigate('/upload')}
          className="md:hidden fixed bottom-20 right-5 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40 shadow-primary/20"
        >
          <Upload className="h-6 w-6" />
        </button>
      </div>

      <DeleteConfirmModal
        isOpen={resumeToDelete !== null}
        onClose={() => setResumeToDelete(null)}
        onConfirm={handleConfirmDelete}
        resumeName={resumeToDelete?.originalFilename || ''}
        isDeleting={deleting === resumeToDelete?._id}
      />
    </PageTransition>
  )
}

