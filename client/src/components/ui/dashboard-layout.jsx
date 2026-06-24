import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuth } from '../../lib/auth-context'
import api from '../../lib/api'
import { Sheet, SheetTrigger, SheetContent } from './sheet'
import { ConfirmModal } from './confirm-modal'
import ThemeToggle from './theme-toggle'
import Logo from './logo'
import {
  LayoutDashboard, Upload, Menu, LogOut, Loader2, User, ChevronLeft, ChevronRight,
  ShieldAlert, Briefcase, Mail, MessageSquare, Compass, Coins
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload Resume', icon: Upload },
]

export default function DashboardLayout() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [activeResume, setActiveResume] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Extract active resume ID from URL path (matches /analysis/:resumeId or /editor/:resumeId)
  const analysisMatch = loc.pathname.match(/^\/(analysis|editor)\/([^/]+)/)
  const activeResumeId = analysisMatch ? analysisMatch[2] : null

  useEffect(() => {
    if (activeResumeId) {
      if (activeResume?._id === activeResumeId) return

      api.get(`/resumes/${activeResumeId}`)
        .then(({ data }) => {
          if (data && data.resume) {
            setActiveResume(data.resume)
          }
        })
        .catch((err) => {
          console.error('Error fetching resume in layout:', err)
          setActiveResume({ _id: activeResumeId, originalFilename: 'Resume Analysis' })
        })
    } else {
      setActiveResume(null)
    }
  }, [activeResumeId, activeResume?._id])

  const toggleSidebar = () => {
    const nextVal = !collapsed
    setCollapsed(nextVal)
    localStorage.setItem('sidebar-collapsed', String(nextVal))
  }

  const analysisTabs = activeResumeId ? [
    { href: `/analysis/${activeResumeId}`, label: 'ATS Audit Scan', icon: ShieldAlert },
    { href: `/analysis/${activeResumeId}/job-matcher`, label: 'ATS Job Matcher', icon: Briefcase },
    { href: `/analysis/${activeResumeId}/cover-letter`, label: 'Cover Letter', icon: Mail },
    { href: `/analysis/${activeResumeId}/interview-prep`, label: 'Interview Prep', icon: MessageSquare },
    { href: `/analysis/${activeResumeId}/roadmap`, label: 'Career Roadmap', icon: Compass },
    { href: `/analysis/${activeResumeId}/salary-negotiation`, label: 'Salary Coach', icon: Coins }
  ] : []

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground font-medium">Loading ResuLens...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  const NavLink = ({ href, label, icon: Icon, nested }) => {
    const active = loc.pathname === href
    return (
      <Link
        to={href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-full transition-all duration-200 ease-out relative',
          nested 
            ? 'px-4 py-2 text-xs font-semibold' 
            : 'px-5 py-3 text-sm font-medium',
          active
            ? 'bg-secondary text-primary font-semibold shadow-xs border border-border/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
          collapsed && (nested ? 'justify-center px-0 h-9 w-9 mx-auto' : 'justify-center px-0 h-11 w-11 mx-auto')
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className={cn(nested ? "h-4 w-4" : "h-5 w-5", "shrink-0", active ? "text-primary" : "text-muted-foreground")} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  const getBreadcrumbs = () => {
    const parts = loc.pathname.split('/').filter((x) => x)
    const crumbs = []
    
    // Always start with Home
    crumbs.push({ label: 'Home', href: '/' })
    
    // Determine context
    if (parts[0] === 'dashboard') {
      crumbs.push({ label: 'Dashboard', href: '/dashboard' })
    } else if (parts[0] === 'upload') {
      crumbs.push({ label: 'Dashboard', href: '/dashboard' })
      crumbs.push({ label: 'Upload Resume', href: '/upload' })
    } else if (parts[0] === 'analysis') {
      crumbs.push({ label: 'Dashboard', href: '/dashboard' })
      crumbs.push({ label: 'Analysis', href: `/analysis/${parts[1]}` })
      if (parts[2] === 'job-matcher') {
        crumbs.push({ label: 'Job Matcher', href: `/analysis/${parts[1]}/job-matcher` })
      } else if (parts[2] === 'cover-letter') {
        crumbs.push({ label: 'Cover Letter', href: `/analysis/${parts[1]}/cover-letter` })
      } else if (parts[2] === 'interview-prep') {
        crumbs.push({ label: 'Interview Prep', href: `/analysis/${parts[1]}/interview-prep` })
      } else if (parts[2] === 'roadmap') {
        crumbs.push({ label: 'Career Roadmap', href: `/analysis/${parts[1]}/roadmap` })
      } else if (parts[2] === 'salary-negotiation') {
        crumbs.push({ label: 'Salary Negotiation', href: `/analysis/${parts[1]}/salary-negotiation` })
      }
    } else if (parts[0] === 'editor') {
      crumbs.push({ label: 'Dashboard', href: '/dashboard' })
      crumbs.push({ label: 'Editor', href: `/editor/${parts[1]}` })
    } else if (parts[0] === 'profile') {
      crumbs.push({ label: 'Profile', href: '/profile' })
    }
    
    return crumbs
  }

  const crumbs = getBreadcrumbs()

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-border bg-card p-4 sticky top-0 h-screen justify-between shadow-xs transition-all duration-300 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}>
        {/* Toggle Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3.5 top-[22px] h-7 w-7 bg-card border border-border text-foreground hover:bg-secondary rounded-full flex items-center justify-center shadow-xs cursor-pointer z-50 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
 
        <div className="flex-1 overflow-y-auto scrollbar-none space-y-6 py-2">
          <Link 
            to="/dashboard" 
            className={cn(
              "flex items-center gap-2.5 py-2 group transition-all duration-200", 
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            <div className="h-9 w-9 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Logo className="h-8 w-8" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent truncate">
                ResuLens
              </span>
            )}
          </Link>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          {activeResumeId && (
            <div className={cn("space-y-2 pt-4 border-t border-border/40", collapsed ? "" : "px-1")}>
              {!collapsed && (
                <div className="px-3 mb-1 flex flex-col gap-0.5">
                  <span className="text-[10px] font-black text-muted-foreground/50 tracking-wider uppercase">Active Resume</span>
                  <span className="text-xs font-bold text-foreground/95 truncate max-w-full" title={activeResume?.originalFilename || 'Loading resume...'}>
                    {activeResume?.originalFilename || 'Loading resume...'}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {analysisTabs.map((item) => (
                  <NavLink key={item.href} {...item} nested />
                ))}
              </div>
            </div>
          )}
        </div>
 
        <div className="border-t border-border pt-4">
          {collapsed ? (
            <div className="flex flex-col items-center gap-4">
              <Link to="/profile" className="relative group/avatar" title="View Profile">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 hover:border-primary/40 transition-colors shrink-0 overflow-hidden">
                  {user.profileImage && user.profileImage.trim() !== '' ? (
                    <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{user.email ? user.email[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
              </Link>
              <ThemeToggle />
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center justify-center rounded-full h-10 w-10 text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="bg-secondary/20 border border-border/40 rounded-2xl p-3 space-y-3">
              <Link to="/profile" className="flex items-center gap-3 min-w-0 group/avatar">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 group-hover/avatar:border-primary/40 transition-colors shrink-0 overflow-hidden">
                  {user.profileImage && user.profileImage.trim() !== '' ? (
                    <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{user.email ? user.email[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground group-hover/avatar:text-primary transition-colors truncate">
                    {user.name || 'User Account'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <ThemeToggle />
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
 
      {/* Mobile menu sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-card p-6 border-r border-border flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto scrollbar-none space-y-6">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-9 w-9 flex items-center justify-center">
                <Logo className="h-8 w-8" />
              </div>
              <span className="font-semibold text-xl tracking-tight">ResuLens</span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}

              {activeResumeId && (
                <div className="space-y-2 pt-4 border-t border-border/40">
                  <div className="px-3 mb-1 flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-muted-foreground/50 tracking-wider uppercase">Active Resume</span>
                    <span className="text-xs font-bold text-foreground/95 truncate max-w-full" title={activeResume?.originalFilename || 'Loading resume...'}>
                      {activeResume?.originalFilename || 'Loading resume...'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {analysisTabs.map((item) => (
                      <NavLink key={item.href} {...item} nested />
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>
 
          <div className="border-t border-border pt-4">
            <div className="bg-secondary/20 border border-border/40 rounded-2xl p-3 space-y-3">
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 min-w-0 group/avatar">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20 shrink-0 overflow-hidden">
                  {user.profileImage && user.profileImage.trim() !== '' ? (
                    <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{user.email ? user.email[0].toUpperCase() : 'U'}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground group-hover/avatar:text-primary transition-colors truncate">
                    {user.name || 'User Account'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <ThemeToggle />
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
 
      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 flex items-center justify-center">
              <Logo className="h-7 w-7" />
            </div>
            <span className="font-semibold text-lg">ResuLens</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SheetTrigger onClick={() => setOpen(true)} className="rounded-full p-2.5 hover:bg-secondary transition-colors">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
          </div>
        </header>
 
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 bg-background bg-grid-pattern overflow-x-hidden">
          {/* Global Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/80 mb-6 tracking-wide uppercase select-none">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-[9px] text-muted-foreground/30 font-bold font-mono">/</span>}
                  {isLast ? (
                    <span className="text-foreground/90 font-black tracking-wider">{crumb.label}</span>
                  ) : (
                    <Link
                      to={crumb.href}
                      className="hover:text-primary transition-colors duration-150"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-3 z-40 shadow-lg">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = loc.pathname === href
            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-1 text-[10px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn("h-5.5 w-5.5", active ? "text-primary" : "text-muted-foreground")} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          await logout()
          setShowLogoutModal(false)
          navigate('/')
        }}
        title="Log out of ResuLens?"
        description="You will be returned to the login page and need to sign in again to access your resumes and analyses."
        confirmLabel="Log out"
        confirmVariant="destructive"
      />
    </div>
  )
}
