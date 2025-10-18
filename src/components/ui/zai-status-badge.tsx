'use client'

import { motion } from 'framer-motion'
import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { designTokens } from '@/styles/design-tokens'

interface ZaiStatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'subtle' | 'outline'
  pulse?: boolean
  children: React.ReactNode
}

export function ZaiStatusBadge({ 
  status, 
  size = 'md', 
  variant = 'solid',
  pulse = false,
  className,
  children 
}: ZaiStatusBadgeProps) {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-full transition-all duration-200'
  ]

  const statusColors = {
    success: {
      solid: 'bg-green-500 text-white',
      subtle: 'bg-green-100 text-green-800',
      outline: 'border border-green-500 text-green-700 bg-green-50'
    },
    warning: {
      solid: 'bg-amber-500 text-white',
      subtle: 'bg-amber-100 text-amber-800',
      outline: 'border border-amber-500 text-amber-700 bg-amber-50'
    },
    error: {
      solid: 'bg-red-500 text-white',
      subtle: 'bg-red-100 text-red-800',
      outline: 'border border-red-500 text-red-700 bg-red-50'
    },
    info: {
      solid: 'bg-blue-500 text-white',
      subtle: 'bg-blue-100 text-blue-800',
      outline: 'border border-blue-500 text-blue-700 bg-blue-50'
    },
    neutral: {
      solid: 'bg-gray-500 text-white',
      subtle: 'bg-gray-100 text-gray-800',
      outline: 'border border-gray-500 text-gray-700 bg-gray-50'
    }
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <motion.div
      className={cn(
        baseClasses,
        statusColors[status][variant],
        sizes[size],
        className
      )}
      animate={pulse ? {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
      } : undefined}
      transition={pulse ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      } : undefined}
    >
      {children}
    </motion.div>
  )
}

export default ZaiStatusBadge