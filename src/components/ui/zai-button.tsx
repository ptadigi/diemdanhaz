'use client'

import { motion } from 'framer-motion'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { designTokens, animations } from '@/styles/design-tokens'

interface ZaiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const ZaiButton = forwardRef<HTMLButtonElement, ZaiButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ]

    const variants = {
      primary: [
        'bg-gradient-to-r from-blue-600 to-blue-700',
        'text-white shadow-lg hover:shadow-xl',
        'hover:from-blue-700 hover:to-blue-800',
        'focus:ring-blue-500'
      ],
      secondary: [
        'bg-gray-100 text-gray-900',
        'border border-gray-200',
        'hover:bg-gray-200 focus:ring-gray-500'
      ],
      outline: [
        'border-2 border-blue-600 text-blue-600',
        'bg-transparent hover:bg-blue-50',
        'focus:ring-blue-500'
      ],
      ghost: [
        'text-gray-700 hover:bg-gray-100',
        'focus:ring-gray-500'
      ],
      success: [
        'bg-gradient-to-r from-green-600 to-green-700',
        'text-white shadow-lg hover:shadow-xl',
        'hover:from-green-700 hover:to-green-800',
        'focus:ring-green-500'
      ],
      warning: [
        'bg-gradient-to-r from-amber-600 to-amber-700',
        'text-white shadow-lg hover:shadow-xl',
        'hover:from-amber-700 hover:to-amber-800',
        'focus:ring-amber-500'
      ],
      error: [
        'bg-gradient-to-r from-red-600 to-red-700',
        'text-white shadow-lg hover:shadow-xl',
        'hover:from-red-700 hover:to-red-800',
        'focus:ring-red-500'
      ]
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
      xl: 'px-8 py-4 text-lg rounded-2xl'
    }

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        whileHover={!disabled && !loading ? animations.buttonHover : undefined}
        whileTap={!disabled && !loading ? animations.buttonTap : undefined}
        {...props}
      >
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        
        <span>{children}</span>
        
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)

ZaiButton.displayName = 'ZaiButton'

export default ZaiButton