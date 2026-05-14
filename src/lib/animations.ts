import { Variants } from 'framer-motion'

// Container animations for staggered children
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Item animations for fade-in with slide-up
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// Fade-in animation
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// Slide-up animation
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Slide-in from left
export const slideInLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Slide-in from right
export const slideInRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Scale animation
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

// Rotate animation
export const rotateVariants: Variants = {
  hidden: { opacity: 0, rotate: -10 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Page transition variants
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

// Modal backdrop variants
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// Modal content variants
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
}

// Floating animation
export const floatingVariants: Variants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Pulse animation
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Bounce animation
export const bounceVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
}

// Hover scale animation
export const hoverScaleVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },
}

// Tap scale animation
export const tapScaleVariants: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.95 },
}

// Card hover effect
export const cardHoverVariants: Variants = {
  rest: { y: 0, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
  hover: {
    y: -8,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    transition: { type: 'spring', stiffness: 300, damping: 10 },
  },
}

// Staggered list animation
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

// Grid animation
export const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

// Text animation
export const textVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut',
    },
  }),
}

// Loading spinner
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

// Progress bar
export const progressVariants: Variants = {
  animate: (progress) => ({
    width: `${progress}%`,
    transition: { duration: 0.3, ease: 'easeOut' },
  }),
}
