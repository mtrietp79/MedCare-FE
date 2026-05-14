import { motion } from 'framer-motion'
import { pageTransitionVariants } from '@/lib/animations'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

/**
 * PageWrapper component that provides smooth page transitions
 * Wraps page content with fade-in and slide-up animations
 */
export function PageWrapper({ children, className = '', delay = 0 }: PageWrapperProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * SectionWrapper component for animating individual sections
 * Useful for hero sections, testimonials, etc.
 */
interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  delay?: number
  id?: string
}

export function SectionWrapper({ children, className = '', delay = 0, id }: SectionWrapperProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
      id={id}
    >
      {children}
    </motion.section>
  )
}

/**
 * HeaderWrapper for animating header/heading content
 */
interface HeaderWrapperProps {
  title: string
  subtitle?: string
  className?: string
}

export function HeaderWrapper({ title, subtitle, className = '' }: HeaderWrapperProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      <motion.h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance" variants={itemVariants}>
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p className="text-muted-foreground mt-2 text-lg max-w-xl" variants={itemVariants}>
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}

/**
 * ContentGrid wrapper for animating grid items
 */
interface ContentGridProps {
  children: React.ReactNode
  columns?: number
  gap?: number
  className?: string
}

export function ContentGrid({ children, columns = 3, gap = 6, className = '' }: ContentGridProps) {
  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <motion.div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-${gap} ${className}`}
      variants={gridVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatedList for displaying list items with animations
 */
interface AnimatedListProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedList({ children, className = '' }: AnimatedListProps) {
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <motion.div
      className={`space-y-4 ${className}`}
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}

/**
 * AnimatedListItem for individual list items
 */
interface AnimatedListItemProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedListItem({ children, className = '' }: AnimatedListItemProps) {
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}
