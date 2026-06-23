import { createContext, useContext, useState, forwardRef } from 'react'
import { cn } from '../../lib/utils'

const TabsContext = createContext({})

const Tabs = ({ defaultValue, value, onValueChange, className, children, ...props }) => {
  const [tab, setTab] = useState(defaultValue)
  const activeTab = value ?? tab
  const setActiveTab = onValueChange ?? setTab
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn(className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-11 items-center justify-center rounded-xl bg-secondary p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = forwardRef(({ className, value, ...props }, ref) => {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 ease-out cursor-pointer',
        activeTab === value ? 'bg-card text-foreground shadow-sm' : 'hover:text-foreground/80',
        className
      )}
      onClick={() => setActiveTab(value)}
      {...props}
    />
  )
})
TabsTrigger.displayName = 'TabsTrigger'

const TabsContent = forwardRef(({ className, value, ...props }, ref) => {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null
  return <div ref={ref} className={cn('mt-4', className)} {...props} />
})
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
