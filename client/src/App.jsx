import { AuthProvider } from './lib/auth-context'
import { ThemeProvider } from './lib/theme-provider'
import QueryProvider from './lib/query-client'
import AppRouter from './routes'

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider defaultTheme="dark" storageKey="resulens-theme">
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  )
}
