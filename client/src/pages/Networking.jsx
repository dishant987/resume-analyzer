import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import {
  Loader2, Send, Copy, Check, Trash2, AlertCircle
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { useResume, useNetworkingMessages, useGenerateNetworkingMessage, useDeleteNetworkingMessage } from '../lib/hooks/use-api'

const messageTypes = [
  { value: 'connection_request', label: 'LinkedIn Connection Request' },
  { value: 'referral_ask', label: 'Referral Request' },
  { value: 'follow_up', label: 'Follow-Up Email' },
  { value: 'cold_email', label: 'Cold Outreach Email' },
]

export default function Networking() {
  const { resumeId } = useParams()
  const { data: resumeData, isLoading } = useResume(resumeId)
  const { data: msgsData, isLoading: msgsLoading } = useNetworkingMessages(resumeId)
  const generateMutation = useGenerateNetworkingMessage()
  const deleteMutation = useDeleteNetworkingMessage()

  const resume = resumeData?.resume
  const messages = msgsData?.messages || []

  const [messageType, setMessageType] = useState('connection_request')
  const [recipientName, setRecipientName] = useState('')
  const [recipientTitle, setRecipientTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [context, setContext] = useState('')
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const handleGenerate = () => {
    setError('')
    generateMutation.mutate({
      id: resumeId,
      messageType,
      recipientName,
      recipientTitle,
      company,
      jobTitle,
      context,
    }, {
      onError: (err) => setError(err.message),
    })
  }

  const handleCopy = async (text, id) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Send className="h-5 w-5 text-pink-500" />
              AI Networking Message Generator
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Generate personalized outreach messages for LinkedIn, email, and referrals.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Message Type</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              >
                {messageTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Recipient Name (optional)</label>
                <input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Recipient Title (optional)</label>
                <input
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                  placeholder="e.g. Engineering Manager"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Company (optional)</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Target Job Title (optional)</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Additional Context (optional)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any specific reason for reaching out, mutual connections, or talking points..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm resize-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="w-full">
              {generateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Send className="h-4 w-4" /> Generate Message</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generated Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {msgsLoading ? (
              <Skeleton className="h-32" />
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No messages generated yet. Fill in the details above and generate your first message.
              </p>
            ) : (
              messages.map((msg) => (
                <Card key={msg._id} className="border border-border/60">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {messageTypes.find((t) => t.value === msg.messageType)?.label || msg.messageType}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => handleCopy(msg.subject ? `Subject: ${msg.subject}\n\n${msg.message}` : msg.message, msg._id)}
                          className="h-8 px-2"
                        >
                          {copiedId === msg._id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => deleteMutation.mutate({ resumeId, msgId: msg._id })}
                          className="h-8 px-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {msg.subject && (
                      <div>
                        <span className="text-xs font-bold text-muted-foreground">Subject:</span>
                        <p className="text-sm font-medium mt-0.5">{msg.subject}</p>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    {(msg.recipientName || msg.company) && (
                      <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                        {msg.recipientName && <span>To: {msg.recipientName}</span>}
                        {msg.company && <span>Company: {msg.company}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
