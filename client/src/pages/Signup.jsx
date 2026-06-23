import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Form, FormField } from '../components/ui/form'
import { auth } from '../lib/api'
import { useAuth } from '../lib/auth-context'
import { FileText, Sparkles, Loader2 } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  const { user, setUser, loading: authLoading } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, authLoading, navigate])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground font-medium">Loading ResuLens...</span>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await auth.signup(form)
      setUser(data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 bg-background bg-grid-pattern transition-colors duration-200">
      <Card className="w-full max-w-[420px] shadow-lg border border-border p-4 sm:p-8 bg-card">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 mb-4 animate-pulse">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with ResuLens today</p>
        </div>

        <CardContent className="p-0">
          <Form onSubmit={handleSubmit} className="space-y-5">
            <FormField name="name" label="Full name">
              <Input
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full"
              />
            </FormField>
            <FormField name="email" label="Email address">
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full"
              />
            </FormField>
            <FormField name="password" label="Password" error={error}>
              <Input
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full"
              />
            </FormField>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-xl p-3 border border-destructive/20 font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <Sparkles className="h-4 w-4 ml-1" />}
            </Button>
          </Form>

          <div className="mt-8 pt-6 border-t border-border/60 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
