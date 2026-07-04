import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import PageTransition from '../components/ui/page-transition'
import {
  Loader2, Sparkles, Copy, Check, AlertCircle
} from 'lucide-react'
import AnalysisNavigation from '../components/ui/analysis-navigation'
import { useResume, useLinkedInProfile, useGenerateLinkedInProfile } from '../lib/hooks/use-api'

export default function LinkedInPage() {
  const { resumeId } = useParams()
  const { data: resumeData, isLoading } = useResume(resumeId)
  const { data: profileData, isLoading: profileLoading } = useLinkedInProfile(resumeId)
  const generateMutation = useGenerateLinkedInProfile()

  const resume = resumeData?.resume
  const profile = profileData?.profile

  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState(null)

  const handleGenerate = () => {
    setError('')
    generateMutation.mutate(resumeId, {
      onError: (err) => setError(err.message),
    })
  }

  const handleCopy = async (text, field) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
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
              <Sparkles className="h-5 w-5 text-blue-500" />
              LinkedIn Profile Converter
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Convert your resume into an optimized LinkedIn profile with keyword-rich headline, about section, and experience descriptions.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="w-full">
              {generateMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating LinkedIn Profile...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> {profile ? 'Regenerate Profile' : 'Generate LinkedIn Profile'}</>
              )}
            </Button>
          </CardContent>
        </Card>

        {profileLoading ? (
          <Skeleton className="h-96" />
        ) : profile ? (
          <div className="space-y-6">
            {/* Headline */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Headline</CardTitle>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleCopy(profile.headline, 'headline')}
                    className="h-8 px-2"
                  >
                    {copiedField === 'headline' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Under 220 characters recommended</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium bg-secondary/30 p-3 rounded-xl border border-border/50">{profile.headline}</p>
                <p className="text-xs text-muted-foreground mt-1">{profile.headline.length} characters</p>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">About Section</CardTitle>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleCopy(profile.about, 'about')}
                    className="h-8 px-2"
                  >
                    {copiedField === 'about' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed bg-secondary/30 p-3 rounded-xl border border-border/50">{profile.about}</p>
              </CardContent>
            </Card>

            {/* Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Experience Descriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.experience?.map((exp, idx) => (
                  <div key={idx} className="border border-border/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{exp.title || 'Role'}</p>
                        {exp.company && <p className="text-xs text-muted-foreground">{exp.company}</p>}
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleCopy(exp.description, `exp-${idx}`)}
                        className="h-8 px-2"
                      >
                        {copiedField === `exp-${idx}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Skills</CardTitle>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleCopy(profile.skills?.join(', '), 'skills')}
                    className="h-8 px-2"
                  >
                    {copiedField === 'skills' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, idx) => (
                    <Badge key={idx} variant="accent" className="font-medium">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {profile.recommendations && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Profile Recommendations</CardTitle>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleCopy(profile.recommendations, 'recs')}
                      className="h-8 px-2"
                    >
                      {copiedField === 'recs' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed bg-secondary/30 p-3 rounded-xl border border-border/50">{profile.recommendations}</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                No profile generated yet. Click the button above to convert your resume into a LinkedIn-optimized profile.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  )
}
