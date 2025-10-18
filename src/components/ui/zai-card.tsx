'use client'

import { motion } from 'framer-motion'
import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { designTokens, animations } from '@/styles/design-tokens'

interface ZaiCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  children: React.ReactNode
}

const ZaiCard = forwardRef<HTMLDivElement, ZaiCardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    hover = false,
    children,
    ...props 
  }, ref) => {
    const baseClasses = [
      'rounded-2xl transition-all duration-300'
    ]

    const variants = {
      default: [
        'bg-white border border-gray-100',
        'shadow-sm'
      ],
      elevated: [
        'bg-white',
        'shadow-lg'
      ],
      outlined: [
        'bg-white border-2 border-gray-200',
        'shadow-none'
      ],
      glass: [
        'bg-white/80 backdrop-blur-xl',
        'border border-white/20',
        'shadow-xl'
      ]
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10'
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          paddings[padding],
          hover && 'cursor-pointer',
          className
        )}
        whileHover={hover ? animations.cardHover : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

ZaiCard.displayName = 'ZaiCard'

export { ZaiCard }
export default ZaiCard