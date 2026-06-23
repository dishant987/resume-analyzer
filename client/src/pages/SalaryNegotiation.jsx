import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, AlertCircle, Coins, ArrowLeft, Send, User, Bot, HelpCircle, Briefcase, Trash2, Maximize2, Minimize2
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'

export default function SalaryNegotiation() {
  const { resumeId } = useParams()
  const navigate = useNavigate()
  const chatEndRef = useRef(null)

  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form inputs for starting session
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [initializing, setInitializing] = useState(false)
  const [initError, setInitError] = useState('')

  // Active negotiation session
  const [negotiations, setNegotiations] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [sending, setSending] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [chatError, setChatError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [isChatFullscreen, setIsChatFullscreen] = useState(false)

  const loadPageData = async () => {
    setLoading(true)
    setError('')
    try {
      const [resumeRes, negRes] = await Promise.all([
        fetch(`/api/resumes/${resumeId}`, { credentials: 'include' }).then((r) => {
          if (!r.ok) throw new Error('Failed to load resume details')
          return r.json()
        }),
        fetch(`/api/resumes/${resumeId}/salary-negotiations`, { credentials: 'include' }).then((r) => {
          if (!r.ok) throw new Error('Failed to load negotiations history')
          return r.json()
        })
      ])
      setResume(resumeRes.resume)
      setNegotiations(negRes.negotiations || [])
      if (negRes.negotiations?.length > 0) {
        setActiveSession(negRes.negotiations[0])
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPageData()
  }, [resumeId])

  useEffect(() => {
    // Scroll chat to bottom when chat history changes
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.chatHistory])

  const handleStartNegotiation = async () => {
    if (!jobTitle.trim()) return
    setInitializing(true)
    setInitError('')
    try {
      const res = await fetch(`/api/resumes/${resumeId}/salary-negotiations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, location }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Initialization failed.')
      }
      setActiveSession(data.negotiation)
      setNegotiations([data.negotiation, ...negotiations])
      // Reset inputs
      setJobTitle('')
      setCompany('')
      setLocation('')
    } catch (err) {
      setInitError(err.message)
    } finally {
      setInitializing(false)
    }
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!userInput.trim() || sending || !activeSession) return

    const messageToSend = userInput.trim()
    setUserInput('')
    setSending(true)
    setChatError('')

    // Optimistically update chat history for user message
    setActiveSession(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, { role: 'user', message: messageToSend }]
    }))

    try {
      const res = await fetch(`/api/resumes/${resumeId}/salary-negotiations/${activeSession._id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send message.')
      }
      setActiveSession(data.negotiation)

      // Update history in list
      setNegotiations(prev => prev.map(n => n._id === data.negotiation._id ? data.negotiation : n))
    } catch (err) {
      setChatError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteSession = async (negId, e) => {
    e.stopPropagation()
    if (deletingId) return
    setDeletingId(negId)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/salary-negotiations/${negId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to delete session')
      }
      const filtered = negotiations.filter(n => n._id !== negId)
      setNegotiations(filtered)
      if (activeSession?._id === negId) {
        setActiveSession(filtered[0] || null)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // Helper to extract the latest assistant message coach feedback
  const getLatestFeedback = () => {
    if (!activeSession?.chatHistory) return ''
    const assistantMessages = activeSession.chatHistory.filter(m => m.role === 'assistant')
    if (assistantMessages.length === 0) return ''
    return assistantMessages[assistantMessages.length - 1].feedback || ''
  }

  const formatCurrency = (val, curr = 'INR') => {
    if (val === undefined || val === null) return '';
    let ISO = (curr || '').toUpperCase().trim();
    if (ISO.includes('INR') || ISO.includes('₹') || ISO.includes('RUPEE') || ISO.includes('RS')) {
      ISO = 'INR';
    } else if (ISO.includes('USD') || ISO.includes('$') || ISO.includes('US')) {
      ISO = 'USD';
    }
    if (ISO.length !== 3) {
      ISO = 'INR';
    }

    let numericVal = Number(val);
    if (isNaN(numericVal)) return val;

    // Smart adjustment for abbreviated values from AI (e.g. 30 instead of 30,00,000 for INR or 120 instead of 120,000 for USD)
    if (ISO === 'INR' && numericVal < 1000) {
      numericVal = numericVal * 100000;
    } else if ((ISO === 'USD' || ISO === 'GBP' || ISO === 'EUR') && numericVal < 1000) {
      numericVal = numericVal * 1000;
    }

    try {
      return new Intl.NumberFormat(ISO === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: ISO,
        maximumFractionDigits: 0
      }).format(numericVal)
    } catch {
      return ISO === 'INR' ? `₹${numericVal.toLocaleString('en-IN')}` : `$${numericVal.toLocaleString('en-US')}`;
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

  const latestFeedback = getLatestFeedback()

  return (
    <PageTransition>
      <div className="w-full space-y-6 pt-2 pb-16">
        <AnalysisNavigation
          resume={resume}
          resumeId={resumeId}
          activeTab="salary-negotiation"
        />

        {!activeSession && !initializing ? (
          /* Start New Negotiation Form */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-500" />
                    Start Negotiation Roleplay Session
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Specify the job position details you want to negotiate. ResuLens will analyze your resume against this role to estimate market range and prepare leverage points.</p>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Job Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 font-medium text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Google, Stripe, or Startup"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 font-medium text-foreground"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground">Location (for local salary data estimation)</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco (CA), London, Remote US..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 font-medium text-foreground"
                    />
                  </div>

                  {initError && (
                    <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                      <span>{initError}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleStartNegotiation}
                    disabled={!jobTitle.trim()}
                    className="w-full shadow-md shadow-emerald-500/10 text-xs py-3 h-10 font-bold"
                  >
                    <Coins className="h-4.5 w-4.5 mr-2" /> Start Negotiation Simulator
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Negotiation History List on Right */}
            <div className="lg:col-span-1">
              <Card className="border border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-sm font-bold">Past Negotiation Runs ({negotiations.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/60 max-h-96 overflow-y-auto scrollbar-none">
                  {negotiations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No previous negotiation sessions. Start one on the left.
                    </div>
                  ) : (
                    negotiations.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => setActiveSession(item)}
                        className="p-3 text-left transition-colors cursor-pointer flex justify-between items-center gap-2 hover:bg-secondary/15"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground truncate">{item.jobTitle}</h4>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {item.company} {item.location && `• ${item.location}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
                          disabled={deletingId === item._id}
                          onClick={(e) => handleDeleteSession(item._id, e)}
                        >
                          {deletingId === item._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : initializing ? (
          /* Loading Estimates state */
          <Card className="max-w-xl mx-auto border border-border mt-10 py-16 text-center">
            <CardContent className="space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-4" />
              <h3 className="font-bold text-foreground text-lg">Estimating Compensation Metrics...</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                ResuLens is researching local compensation ranges for a <span className="text-foreground font-bold">"{jobTitle}"</span> at <span className="text-foreground font-bold">"{company || 'our company'}"</span>, preparing negotiation leverages based on your resume, and briefing the HR Manager.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* ACTIVE SESSION VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Left 2 Columns: Chat log */}
            <div className={`${isChatFullscreen ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4 flex flex-col ${isChatFullscreen ? 'h-[720px]' : 'h-[600px]'} transition-all duration-300`}>
              <Card className="border border-border flex flex-col flex-1 min-h-0 bg-card overflow-hidden">
                <CardHeader className="py-4 border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Briefcase className="h-4.5 w-4.5 text-emerald-500" />
                      Roleplay Chat with HR
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Targeting: <span className="text-foreground font-bold">{activeSession.jobTitle}</span> {activeSession.company && `at ${activeSession.company}`} {activeSession.location && `(${activeSession.location})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setIsChatFullscreen(!isChatFullscreen)}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold gap-1.5 h-8 cursor-pointer"
                      title={isChatFullscreen ? "Show split panels" : "Show full screen chat"}
                    >
                      {isChatFullscreen ? (
                        <>
                          <Minimize2 className="h-3.5 w-3.5" />
                          <span>Split View</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="h-3.5 w-3.5" />
                          <span>Full Screen</span>
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setActiveSession(null)
                        setIsChatFullscreen(false)
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 cursor-pointer"
                    >
                      Reset Panel
                    </Button>
                  </div>
                </CardHeader>

                {/* Messages log */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none min-h-0">
                  {isChatFullscreen && latestFeedback && (
                    <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 text-foreground rounded-2xl text-xs font-medium space-y-1 mb-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <HelpCircle className="h-4 w-4" /> Live AI Coach Advice
                      </div>
                      <p className="whitespace-pre-wrap">{latestFeedback}</p>
                    </div>
                  )}
                  {activeSession.chatHistory?.map((msg, idx) => {
                    const isUser = msg.role === 'user'
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start gap-2.5 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar icon */}
                          <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${isUser
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            }`}>
                            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          </div>

                          {/* Message Bubble */}
                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-medium ${isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-secondary text-foreground rounded-tl-none border border-border/60'
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.message}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2.5 flex-row">
                        <div className="h-8 w-8 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="p-3.5 rounded-2xl bg-secondary text-foreground rounded-tl-none border border-border/60 text-xs flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>HR is formulating a response and Coach is writing tips...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </CardContent>

                {/* Message input */}
                <div className="p-4 border-t border-border/50 bg-secondary/5">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Type your negotiation statement here..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={sending}
                      className="flex-1 rounded-xl border border-border bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/45 font-medium text-foreground"
                    />
                    <Button
                      type="submit"
                      disabled={sending || !userInput.trim()}
                      className="h-10 px-4 gap-1.5 shrink-0"
                    >
                      <span>Send</span>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                  {chatError && (
                    <p className="text-[10px] text-destructive font-semibold mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {chatError}
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column: Estimates, Strategy & LIVE Coach panel */}
            {!isChatFullscreen && (
              <div className="lg:col-span-1 space-y-6">

                {/* Estimates Card */}
                {activeSession.marketEstimates && (
                  <Card className="border border-border">
                    <CardHeader className="pb-3 border-b border-border/50">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Estimated Market Salaries</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-secondary/20 border border-border/40">
                          <div className="text-[9px] font-black text-muted-foreground uppercase">Low End</div>
                          <div className="text-xs font-extrabold text-foreground mt-0.5">
                            {formatCurrency(activeSession.marketEstimates.low, activeSession.marketEstimates.currency)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                          <div className="text-[9px] font-black text-emerald-500 uppercase">Median</div>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {formatCurrency(activeSession.marketEstimates.median, activeSession.marketEstimates.currency)}
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-secondary/20 border border-border/40">
                          <div className="text-[9px] font-black text-muted-foreground uppercase">High End</div>
                          <div className="text-xs font-extrabold text-foreground mt-0.5">
                            {formatCurrency(activeSession.marketEstimates.high, activeSession.marketEstimates.currency)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Coach Feedback Panel (Crucial Feature!) */}
                <Card className="border border-emerald-500/30 ring-1 ring-emerald-500/5 bg-emerald-500/5 relative overflow-hidden">
                  <CardHeader className="pb-2 border-b border-emerald-500/15">
                    <CardTitle className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4" /> Live AI Coach Advice
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 min-h-[120px]">
                    {latestFeedback ? (
                      <p className="text-xs leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                        {latestFeedback}
                      </p>
                    ) : (
                      <p className="text-xs leading-relaxed text-muted-foreground italic">
                        Coaching feedback will update here dynamically as you reply. Review the salary guidelines above and construct a professional opening counter-offer based on the estimated Median/High metrics.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Resume Leverage Points & Strategy Card */}
                {activeSession.negotiationStrategy && (
                  <Card className="border border-border">
                    <CardHeader className="pb-3 border-b border-border/50">
                      <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Resume Leverage Points</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {/* Leverage points list */}
                      {activeSession.negotiationStrategy.leveragePoints?.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[9px] font-black text-primary uppercase tracking-widest">Personal Assets to Highlight</div>
                          <ul className="list-disc list-inside text-xs text-muted-foreground pl-1 space-y-1 leading-relaxed">
                            {activeSession.negotiationStrategy.leveragePoints.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* General tips */}
                      {activeSession.negotiationStrategy.tips?.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border/40">
                          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tactical Advice</div>
                          <ul className="list-decimal list-inside text-xs text-muted-foreground pl-1 space-y-1 leading-relaxed">
                            {activeSession.negotiationStrategy.tips.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              </div>
            )}

          </div>
        )}
      </div>
    </PageTransition>
  )
}
