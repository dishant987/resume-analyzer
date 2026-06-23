import { useNavigate } from 'react-router-dom'
import { Button } from './button'
import { Badge } from './badge'
import {
  Loader2, ArrowLeft, Wand2,
  Briefcase
} from 'lucide-react'

export default function AnalysisNavigation({ resume, resumeId, onAnalyze, analyzing }) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
        Back to dashboard
      </button>

      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-foreground truncate tracking-tight">{resume.originalFilename}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
            <span>Uploaded {new Date(resume.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>&bull;</span>
            <span className="capitalize font-semibold text-primary">{resume.status}</span>
          </p>
        </div>
        
        {/* Action Trigger */}
        <div className="shrink-0">
          {resume.status === 'uploaded' && onAnalyze && (
            <Button onClick={onAnalyze} disabled={analyzing} size="lg" className="w-full sm:w-auto shadow-md shadow-primary/15">
              {analyzing ? (
                <><Loader2 className="h-4.5 w-4.5 animate-spin" /> Running Scan...</>
              ) : (
                <><Briefcase className="h-4.5 w-4.5" /> Run Analysis</>
              )}
            </Button>
          )}
          {resume.status === 'analyzed' && (
            <Button onClick={() => navigate(`/editor/${resumeId}`)} size="lg" className="w-full sm:w-auto shadow-md shadow-primary/15">
              <Wand2 className="h-4.5 w-4.5" /> Optimize Side-by-Side
            </Button>
          )}
          {resume.status === 'improved' && (
            <Button onClick={() => navigate(`/editor/${resumeId}`)} size="lg" variant="outline" className="w-full sm:w-auto">
              <Wand2 className="h-4.5 w-4.5" /> View Improvements
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

