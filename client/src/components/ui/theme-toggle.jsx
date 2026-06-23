import { useTheme } from '../../lib/theme-provider'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center h-10 w-10 rounded-full border border-border bg-card text-foreground hover:bg-secondary hover:text-secondary-foreground transition-all duration-200 shadow-sm overflow-hidden focus:outline-none cursor-pointer"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.div
            key="light"
            initial={{ y: 15, rotate: 45, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -15, rotate: -45, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Sun className="h-5 w-5 text-amber-500" />
          </motion.div>
        ) : (
          <motion.div
            key="dark"
            initial={{ y: 15, rotate: -45, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -15, rotate: 45, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Moon className="h-5 w-5 text-indigo-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
