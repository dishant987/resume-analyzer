import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Progress } from '../components/ui/progress'
import PageTransition from '../components/ui/page-transition'
import { Upload as UploadIcon, FileText, CheckCircle, AlertCircle, X, ArrowLeft } from 'lucide-react'

export default function Upload() {
  const navigate = useNavigate()
  const inputRef = useRef()
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validate = (f) => {
    const name = f.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setError('Only PDF and DOCX files are allowed')
      return false
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB')
      return false
    }
    return true
  }

  const handleFile = (f) => {
    setError('')
    setSuccess(false)
    if (validate(f)) {
      setFile(f)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85))
    }, 300)

    try {
      const form = new FormData()
      form.append('resume', file)
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        credentials: 'include',
        body: form,
      })
      const data = await res.json()
      clearInterval(interval)
      if (!res.ok) throw new Error(data.message || 'Upload failed')
      setProgress(100)
      setSuccess(true)
      setTimeout(() => navigate(`/analysis/${data.resume._id}`), 800)
    } catch (err) {
      clearInterval(interval)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6 pt-4">
        
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to dashboard
        </button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Upload Resume</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload your PDF or DOCX file to run detailed compatibility tests.</p>
        </div>

        {/* Upload Container */}
        <Card className="shadow-sm border border-border">
          <CardContent className="p-6 sm:p-10">
            {error && (
              <div className="mb-6 flex items-center gap-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4 font-semibold">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-20 px-6 cursor-pointer transition-all duration-200 ${
                  dragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-secondary/40'
                }`}
              >
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-6 text-muted-foreground group-hover:text-primary transition-colors">
                  <UploadIcon className="h-7 w-7" />
                </div>
                <p className="font-bold text-foreground text-lg text-center">Drag and drop your resume here</p>
                <p className="text-sm text-muted-foreground mt-2 text-center">or click to browse files from your computer</p>
                <p className="text-xs text-muted-foreground/80 mt-4 bg-secondary px-3 py-1 rounded-full border border-border/40">PDF or DOCX &bull; Max 5MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/30 p-5">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {!uploading && !success && (
                    <button 
                      onClick={() => {
                        setFile(null)
                        setError('')
                        if (inputRef.current) inputRef.current.value = ''
                      }} 
                      className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground"
                      title="Remove file"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  {success && <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" />}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground px-1">
                      <span>Analyzing structure...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                {!uploading && !success && (
                  <Button onClick={handleUpload} className="w-full shadow-md shadow-primary/15" size="lg">
                    <UploadIcon className="h-5 w-5" />
                    Upload & Start AI Scan
                  </Button>
                )}
                {success && (
                  <div className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 py-4 rounded-xl">
                    Resume uploaded successfully! Redirecting to analysis...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
