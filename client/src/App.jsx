import { AuthProvider } from './lib/auth-context'
import { ThemeProvider } from './lib/theme-provider'
import AppRouter from './routes'

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="resulens-theme">
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}
