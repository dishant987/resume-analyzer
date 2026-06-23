import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { FileText, Menu, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from './theme-toggle'
import { Button } from './button'
import { useAuth } from '../../lib/auth-context'

export default function PublicLayout() {
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const location = useLocation()

  // Track scroll position to adjust header styling dynamically
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' }
  ]

  const handleNavClick = (e, href) => {
    if (href.startsWith('#') && location.pathname === '/') {
      e.preventDefault()
      const element = document.getElementById(href.slice(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      
      {/* Header element with dynamic padding, shadow and translucency */}
      <header 
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${
          scrolled 
            ? 'h-14 border-border shadow-md shadow-foreground/[0.02]' 
            : 'h-16 border-transparent'
        }`}
        style={{ 
          backgroundColor: scrolled 
            ? 'color-mix(in srgb, var(--background) 85%, transparent)' 
            : 'color-mix(in srgb, var(--background) 70%, transparent)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
          
          {/* Logo with micro-interactions */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20"
            >
              <FileText className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent flex items-center gap-1">
              ResuLens
              
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item, idx) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground px-3.5 py-2 rounded-full transition-colors duration-200"
              >
                {hoveredIndex === idx && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-secondary rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                {item.label}
              </a>
            ))}
          </nav>

          {/* Action Buttons & Theme Toggler */}
          <div className="hidden md:flex items-center gap-4">
            {!loading && user ? (
              <Link 
                to="/dashboard" 
                className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/95 shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-bold text-muted-foreground hover:text-foreground px-4 py-2 rounded-full hover:bg-secondary transition-all"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/95 shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  Get started
                </Link>
              </>
            )}
            <div className="border-l border-border pl-4 h-6 flex items-center">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Actions */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            
            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-14 z-40 border-b border-border shadow-2xl md:hidden overflow-hidden"
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--background) 95%, transparent)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          >
            <div className="px-5 py-6 space-y-4 flex flex-col font-semibold">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(e, item.href)
                    setMobileMenuOpen(false)
                  }}
                  className="text-base text-muted-foreground hover:text-foreground py-2 border-b border-border/40 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              
              <div className="pt-4 flex flex-col gap-3">
                {!loading && user ? (
                  <Link to="/dashboard" className="w-full">
                    <Button className="w-full justify-center py-5 font-bold shadow-md shadow-primary/10">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="w-full">
                      <Button variant="outline" className="w-full justify-center py-5 font-bold">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" className="w-full">
                      <Button className="w-full justify-center py-5 font-bold shadow-md shadow-primary/10">
                        Get Started Free
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        <Outlet />
      </main>
    </div>
  )
}
