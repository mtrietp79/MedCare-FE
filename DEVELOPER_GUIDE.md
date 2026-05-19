# MedCare Frontend - Developer Best Practices

## 🎯 Core Principles

### 1. User Experience First
- Every component must have loading, error, and empty states
- Animations should enhance, not distract
- All interactions should have visual feedback
- Mobile experience is equally important as desktop

### 2. Accessibility Matters
```tsx
// Always include ARIA labels
<button aria-label="Close dialog">×</button>

// Use semantic HTML
<nav>...</nav>
<main>...</main>
<article>...</article>

// Color should never be the only indicator
<div className="flex items-center gap-2">
  <AlertCircle className="text-destructive" />
  <span>Error: {message}</span>
</div>
```

### 3. Performance Optimization
```tsx
// 1. Memoize expensive components
const DoctorCard = React.memo(({ doctor }) => {
  return <Card>{doctor.name}</Card>
})

// 2. Use useCallback for handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies])

// 3. Lazy load heavy components
const ScheduleWidget = lazy(() => import('./schedule'))

// 4. Use React Query or SWR for data
import { useQuery } from '@tanstack/react-query'
```

### 4. Type Safety
```typescript
// Always define interfaces for props
interface DoctorCardProps {
  doctor: Doctor
  variant?: 'default' | 'compact'
  index?: number
}

// Use strict TypeScript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## 📋 Code Structure

### Component Template
```tsx
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ItemIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { itemVariants } from '@/lib/animations'
import type { Item } from '@/types'

interface MyComponentProps {
  items: Item[]
  isLoading?: boolean
  error?: string | null
  onAction?: (id: string) => void
}

/**
 * MyComponent - Brief description
 * 
 * Usage:
 * ```tsx
 * <MyComponent items={items} isLoading={loading} />
 * ```
 */
export function MyComponent({
  items,
  isLoading = false,
  error = null,
  onAction,
}: MyComponentProps) {
  // Memoized values
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  // Render states in order
  if (isLoading) {
    return <GridSkeleton count={6} />
  }

  if (error) {
    return <ErrorState description={error} />
  }

  if (sortedItems.length === 0) {
    return <EmptyState title="No items found" />
  }

  // Main render
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid gap-6"
    >
      {sortedItems.map((item, i) => (
        <motion.div
          key={item.id}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: i * 0.1 }}
        >
          <ItemCard item={item} onAction={onAction} />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### Page Component Template
```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { ErrorState } from '@/components/ui/empty-state'
import { GridSkeleton } from '@/components/ui/skeleton-loader'
import { toast } from 'sonner'
import { api } from '@/services/api'

export function MyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await api.endpoint.getAll()
        setData(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, navigate])

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Page Title</h1>

        {loading && <GridSkeleton count={6} />}
        {error && <ErrorState description={error} />}
        {!loading && data.length === 0 && <EmptyState />}
        {!loading && !error && data.length > 0 && (
          <div className="grid gap-6">
            {/* Content */}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
```

## 🎨 Styling Guidelines

### Tailwind CSS Best Practices
```tsx
// ✅ DO: Use utility classes consistently
<div className="flex items-center gap-4 p-4 rounded-lg bg-card border shadow-sm">
  <div className="w-12 h-12 rounded-lg bg-primary/10" />
</div>

// ❌ DON'T: Mix inline styles with classes
<div className="flex gap-4" style={{ color: '#blue' }}>

// ✅ DO: Use responsive prefixes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

// ❌ DON'T: Use hardcoded breakpoints
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto, 250px)' }}>
```

### CSS Module Alternative (for scoped styles)
```tsx
// component.module.css
.card {
  @apply rounded-lg border shadow-sm hover:shadow-lg transition-shadow;
}

// component.tsx
import styles from './component.module.css'

<div className={styles.card}>Content</div>
```

## 🔄 Data Fetching

### API Service Pattern
```typescript
// services/api.ts
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const api = {
  doctors: {
    getAll: () => client.get('/doctors').then(r => r.data),
    getById: (id: string) => client.get(`/doctors/${id}`).then(r => r.data),
    create: (data: any) => client.post('/doctors', data).then(r => r.data),
    update: (id: string, data: any) => client.put(`/doctors/${id}`, data).then(r => r.data),
    delete: (id: string) => client.delete(`/doctors/${id}`),
  },
  appointments: {
    // Similar pattern
  },
}
```

### Using in Components
```tsx
const [data, setData] = useState([])

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await api.doctors.getAll()
      setData(result)
    } catch (err) {
      handleError(err)
    }
  }
  fetchData()
}, [])
```

## 📝 Form Handling

### Form with Validation
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, formState: { errors }, handleSubmit, reset } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validate on change
  })

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      setIsSubmitting(true)
      await api.auth.register(data)
      toast.success('Registration successful!')
      reset()
      navigate('/login')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          {...register('email')}
          type="email"
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="text-destructive text-sm mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <Input
          {...register('password')}
          type="password"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="text-destructive text-sm mt-1">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Registering...' : 'Register'}
      </Button>
    </form>
  )
}
```

## 🐛 Error Handling

### Consistent Error Pattern
```tsx
// 1. Define error types
interface ApiError {
  status: number
  message: string
  details?: Record<string, string>
}

// 2. Create error handler
function handleApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    return {
      status: err.response?.status || 500,
      message: err.response?.data?.message || 'An error occurred',
      details: err.response?.data?.details,
    }
  }
  return {
    status: 500,
    message: err instanceof Error ? err.message : 'Unknown error',
  }
}

// 3. Use in components
try {
  const result = await api.doctors.getAll()
} catch (err) {
  const error = handleApiError(err)
  toast.error(error.message)
  if (error.status === 401) {
    navigate('/login')
  }
}
```

## 🧪 Testing

### Component Testing Pattern
```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { DoctorCard } from './doctor-card'

describe('DoctorCard', () => {
  const mockDoctor = {
    id: '1',
    name: 'Dr. John Doe',
    specialty: 'Cardiology',
    rating: 4.8,
    // ... other properties
  }

  it('renders doctor information', () => {
    render(<DoctorCard doctor={mockDoctor} />)
    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument()
    expect(screen.getByText('Cardiology')).toBeInTheDocument()
  })

  it('handles click on booking button', () => {
    const handleBook = vi.fn()
    render(<DoctorCard doctor={mockDoctor} onBook={handleBook} />)
    
    const button = screen.getByRole('button', { name: /book/i })
    fireEvent.click(button)
    
    expect(handleBook).toHaveBeenCalledWith(mockDoctor.id)
  })
})
```

## 📦 Environment Variables

### .env.local
```env
# API
VITE_API_URL=http://localhost:3000/api

# Analytics
VITE_GA_ID=your_google_analytics_id
```

### Usage
```typescript
const apiUrl = import.meta.env.VITE_API_URL
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD
```

## 🚀 Performance Checklist

- [ ] Images are optimized and use srcset
- [ ] Code splitting implemented for routes
- [ ] Heavy computations are memoized
- [ ] Infinite loops prevented in useEffect
- [ ] API calls are debounced/throttled when needed
- [ ] Unused dependencies removed
- [ ] Bundle size analyzed and optimized
- [ ] Lighthouse score > 90
- [ ] Web Vitals optimized
- [ ] Database queries are efficient

## 📚 Documentation

### Component JSDoc
```typescript
/**
 * DoctorCard Component
 * 
 * Displays a doctor's information in a card format with
 * animation effects. Supports two variants: default and compact.
 * 
 * @component
 * @example
 * const doctor = { name: 'Dr. John', specialty: 'Cardiology' }
 * return <DoctorCard doctor={doctor} variant="default" />
 * 
 * @param {DoctorCardProps} props - Component props
 * @param {Doctor} props.doctor - Doctor data object
 * @param {string} [props.variant='default'] - Card variant
 * @param {number} [props.index=0] - Animation stagger index
 * @returns {React.ReactElement} Rendered doctor card
 */
```

## ✅ Pre-commit Checklist

- [ ] Code passes linting (`npm run lint`)
- [ ] TypeScript compiles without errors
- [ ] Components have proper prop types
- [ ] Loading/error/empty states implemented
- [ ] Animations are smooth (under 600ms)
- [ ] Mobile responsive (tested on multiple devices)
- [ ] Accessibility checks (keyboard navigation, ARIA labels)
- [ ] No console errors or warnings
- [ ] Comments for complex logic
- [ ] Git commit message is clear

---

**Remember**: Good code is readable, maintainable, and user-friendly code!
