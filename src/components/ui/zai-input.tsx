'use client'

import { motion } from 'framer-motion'
import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { designTokens } from '@/styles/design-tokens'

interface ZaiInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'outlined'
}

const ZaiInput = forwardRef<HTMLInputElement, ZaiInputProps>(
  ({ 
    className, 
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    type,
    id,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const baseClasses = [
      'w-full px-4 py-3 rounded-xl transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-1',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ]

    const variants = {
      default: [
        'bg-gray-50 border border-gray-200',
        'focus:bg-white focus:border-blue-500 focus:ring-blue-500',
        'hover:bg-gray-100'
      ],
      filled: [
        'bg-gray-100 border-0',
        'focus:bg-white focus:ring-2 focus:ring-blue-500',
        'hover:bg-gray-200'
      ],
      outlined: [
        'bg-transparent border-2 border-gray-300',
        'focus:border-blue-500 focus:ring-blue-500',
        'hover:border-gray-400'
      ]
    }

    const errorClasses = error ? [
      'border-red-500 focus:border-red-500 focus:ring-red-500',
      'bg-red-50'
    ] : []

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <motion.input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              baseClasses,
              variants[variant],
              errorClasses,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            animate={{
              scale: focused ? 1.01 : 1,
            }}
            transition={{ duration: 0.2 }}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p 
            className="text-sm text-red-600"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

ZaiInput.displayName = 'ZaiInput'

export default ZaiInput