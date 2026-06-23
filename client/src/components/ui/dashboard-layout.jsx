import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useAuth } from '../../lib/auth-context'
import { Sheet, SheetTrigger, SheetContent } from './sheet'
import ThemeToggle from './theme-toggle'
import {
  LayoutDashboard, Upload, FileText, Menu, LogOut, Loader2, User, ChevronLeft, ChevronRight
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

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true })
  }, [user, loading, navigate])

  const toggleSidebar = () => {
    const nextVal = !collapsed
    setCollapsed(nextVal)
    localStorage.setItem('sidebar-collapsed', String(nextVal))
  }

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

  const NavLink = ({ href, label, icon: Icon }) => {
    const active = loc.pathname === href
    return (
      <Link
        to={href}
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium transition-all duration-200 ease-out relative',
          active
            ? 'bg-secondary text-primary font-semibold shadow-sm border border-border/20'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
          collapsed && 'justify-center px-0 h-11 w-11 mx-auto'
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
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
          className="absolute -right-3.5 top-6 h-7 w-7 bg-card border border-border text-foreground hover:bg-secondary rounded-full flex items-center justify-center shadow-xs cursor-pointer z-50 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
 
        <div className="space-y-6">
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 group">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <FileText className="h-5 w-5 text-primary-foreground" />
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
        </div>
 
        <div className="border-t border-border pt-4">
          {collapsed ? (
            <div className="flex flex-col items-center gap-4">
              <Link to="/profile" className="relative group/avatar" title="View Profile">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary border border-border hover:border-primary/40 transition-colors shrink-0 overflow-hidden">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.email ? user.email[0].toUpperCase() : 'U'
                  )}
                </div>
              </Link>
              <ThemeToggle />
              <button
                onClick={logout}
                className="flex items-center justify-center rounded-full h-10 w-10 text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 px-3">
                <Link to="/profile" className="flex items-center gap-2 min-w-0 group/avatar">
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-primary border border-border hover:border-primary/40 transition-colors shrink-0 overflow-hidden">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      user.email ? user.email[0].toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover/avatar:text-primary transition-colors truncate">
                      {user.name || 'User Account'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </Link>
                <ThemeToggle />
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-all cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </>
          )}
        </div>
      </aside>
 
      {/* Mobile menu sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-card p-6 border-r border-border flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl tracking-tight">ResuLens</span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>
 
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-4 px-3">
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.email ? user.email[0].toUpperCase() : 'U'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user.name || 'User Account'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>
              <ThemeToggle />
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-all cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>
 
      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <FileText className="h-4.5 w-4.5 text-primary-foreground" />
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
    </div>
  )
}
