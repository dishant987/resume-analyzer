import { createContext, useContext, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { Label } from './label'

const FormContext = createContext({})

const Form = ({ schema, onSubmit, defaultValues, children, className, ...props }) => {
  return (
    <form
      onSubmit={onSubmit}
      className={cn('space-y-5', className)}
      noValidate
      {...props}
    >
      {children}
    </form>
  )
}

const FormField = ({ name, label, error, children, className }) => (
  <div className={cn('space-y-2', className)}>
    {label && <Label htmlFor={name}>{label}</Label>}
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
)

export { Form, FormField }
