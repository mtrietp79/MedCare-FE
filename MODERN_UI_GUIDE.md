# MedCare Frontend - Modern UI/UX Guide

## 🎨 Design Philosophy

MedCare frontend is built with a **clean, minimal, and healthcare-oriented** design approach:

- **Primary Colors**: Blue (#0a8bd8) - Trust, professionalism, healthcare
- **Secondary Colors**: White, light grays - Clarity and simplicity
- **Accent Colors**: Cyan/Turquoise - Energy and innovation
- **Spacing**: Consistent 8px grid system
- **Typography**: Clear hierarchy with generous whitespace
- **Shadows**: Soft, subtle shadows for depth
- **Rounded Corners**: 8-12px for modern appearance
- **Animations**: Smooth, purposeful transitions with Framer Motion

## 📦 Key Technologies

- **React 19.2.4** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Smooth animations and gestures
- **Radix UI** - Accessible component primitives
- **React Router v6** - Client-side routing
- **Lucide React** - Beautiful, consistent icons
- **Sonner** - Toast notifications
- **React Hook Form** - Efficient form management
- **Zod** - Schema validation

## 🏗️ Component Architecture

### Core Components Structure

```
src/components/
├── ui/                          # Reusable UI components
│   ├── button.tsx              # Button variations
│   ├── card.tsx                # Card container
│   ├── input.tsx               # Form input
│   ├── skeleton-loader.tsx     # Loading skeletons with animations
│   ├── empty-state.tsx         # Empty states with icons
│   ├── page-wrapper.tsx        # Page transition wrapper
│   └── ...other ui components
├── home/                        # Home page components
│   ├── hero-section.tsx        # Animated hero
│   ├── featured-doctors.tsx    # Featured doctors grid
│   ├── specialty-section.tsx   # Specialty cards
│   └── ...other sections
├── doctors/                     # Doctor-related components
│   ├── doctor-card.tsx         # Doctor card with animations
│   ├── doctor-filter.tsx       # Filter component
│   └── doctor-layout.tsx
├── booking/                     # Booking wizard
│   ├── booking-wizard.tsx      # Multi-step booking form
│   ├── schedule-form.tsx
│   └── ...booking components
├── auth/                        # Authentication components
├── layout/                      # Layout wrappers
│   ├── header.tsx              # Navigation header
│   ├── footer.tsx              # Footer
│   └── ...layouts
└── admin/                       # Admin dashboard components
```

## 🎬 Animation System

### Preset Animations (in `src/lib/animations.ts`)

All animations are centralized for consistency:

```typescript
import {
  containerVariants,
  itemVariants,
  fadeInVariants,
  slideUpVariants,
  cardHoverVariants,
  gridContainerVariants,
  pageTransitionVariants,
  floatingVariants,
  pulseVariants,
} from '@/lib/animations'
```

### Using Animations

#### Page Transitions
```tsx
import { motion } from 'framer-motion'
import { pageTransitionVariants } from '@/lib/animations'

export function MyPage() {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransitionVariants}
    >
      {/* Page content */}
    </motion.div>
  )
}
```

#### Staggered Items
```tsx
import { containerVariants, itemVariants } from '@/lib/animations'

export function ItemList() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants}>
          {item.content}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

#### Card Hover Effects
```tsx
import { cardHoverVariants } from '@/lib/animations'

export function InteractiveCard() {
  return (
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
    >
      Card content
    </motion.div>
  )
}
```

## 💾 Loading States

### Skeleton Loaders
Professional skeleton loaders with smooth animations:

```tsx
import {
  DoctorCardSkeleton,
  SpecialtySkeleton,
  GridSkeleton,
  FormSkeleton,
} from '@/components/ui/skeleton-loader'

// In your component
{loading ? (
  <GridSkeleton count={6} />
) : (
  <DoctorGrid doctors={doctors} />
)}
```

### Empty States
Animated, user-friendly empty states:

```tsx
import {
  EmptyState,
  EmptyAppointments,
  EmptySearch,
  ErrorState,
} from '@/components/ui/empty-state'

// Usage
{data.length === 0 && (
  <EmptyAppointments />
)}
```

## 🎯 Best Practices

### 1. Loading State Pattern
```typescript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await api.endpoint.getAll()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])

// Render with proper states
return (
  <>
    {loading && <GridSkeleton count={6} />}
    {error && <ErrorState title="Error" description={error} />}
    {!loading && !error && data.length === 0 && <EmptyState />}
    {!loading && !error && data.length > 0 && <DataGrid data={data} />}
  </>
)
```

### 2. Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Use Tailwind responsive prefixes: `md:`, `lg:`, etc.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* Items */}
</div>
```

### 3. Component Composition
```tsx
interface CardProps {
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  isLoading?: boolean
  error?: string | null
}

export function MyCard({ title, isLoading, error, ...props }: CardProps) {
  if (isLoading) return <DoctorCardSkeleton />
  if (error) return <ErrorState description={error} />
  
  return <Card>{/* Content */}</Card>
}
```

### 4. Animation Best Practices
- Keep animations under 600ms for interactions
- Use spring physics for natural feel
- Stagger animations for visual interest
- Always provide `exit` animation
- Use `whileInView` for scroll animations

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  viewport={{ once: true, margin: '-100px' }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  Content
</motion.div>
```

## 🔧 Styling Guidelines

### Color System
```css
/* Primary - Trust & Healthcare */
--primary: oklch(0.59 0.17 240);  /* Blue */

/* Secondary - Clean & Minimal */
--secondary: oklch(0.95 0.01 240); /* Light gray */

/* Accent - Energy */
--accent: oklch(0.72 0.14 160);   /* Cyan */

/* Semantic Colors */
--destructive: oklch(0.577 0.245 27.325); /* Red for errors */
```

### Using Color Classes
```tsx
// Button variants
<Button className="bg-primary text-primary-foreground" />
<Button className="bg-secondary text-secondary-foreground" />

// Background
<div className="bg-secondary/30" /> {/* 30% opacity */}

// Text colors
<span className="text-primary" />
<span className="text-muted-foreground" />
```

### Shadow System
```tsx
// Card with soft shadow
<Card className="shadow-sm" /> {/* 0 1px 2px */}
<Card className="shadow-lg" /> {/* 0 10px 15px */}

// Hover lift effect
<motion.div
  whileHover={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
>
  Content
</motion.div>
```

### Rounded Corners
```tsx
<div className="rounded-lg" />      {/* 8px */}
<div className="rounded-xl" />      {/* 12px */}
<div className="rounded-2xl" />     {/* 16px */}
<div className="rounded-3xl" />     {/* 24px */}
```

## 📱 Responsive Patterns

### Hero Section
```tsx
<div className="grid lg:grid-cols-2 gap-12 items-center">
  {/* Content - full width on mobile, left side on desktop */}
  <div className="space-y-8">
    {/* Stack vertically */}
  </div>
  
  {/* Image - hidden on mobile, right side on desktop */}
  <div className="hidden lg:block">
    {/* Visual element */}
  </div>
</div>
```

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 column mobile, 2 columns tablet, 3 columns desktop */}
  {items.map((item) => <Card key={item.id}>{item}</Card>)}
</div>
```

### Mobile-First Form
```tsx
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input placeholder="First name" />
    <Input placeholder="Last name" />
  </div>
  
  <div className="md:flex gap-2">
    <Button className="w-full md:w-auto">Submit</Button>
    <Button variant="outline" className="w-full md:w-auto">Cancel</Button>
  </div>
</form>
```

## 🎓 Form & Validation

### Form with Validation
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})

export function LoginForm() {
  const { register, formState: { errors }, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input {...register('email')} />
        {errors.email && (
          <motion.p className="text-destructive text-sm mt-1">
            {errors.email.message}
          </motion.p>
        )}
      </div>
    </form>
  )
}
```

## 📢 Toast Notifications

### Sonner Toast
```tsx
import { toast } from 'sonner'

// Success
toast.success('Appointment booked!', {
  description: 'Confirmation sent to your email',
})

// Error
toast.error('Failed to book', {
  description: 'Please try again',
})

// Loading
const loadingId = toast.loading('Processing...')
// Later: update it
toast.dismiss(loadingId)
toast.success('Done!')
```

## 📖 Component Examples

### Doctor Card
```tsx
<DoctorCard 
  doctor={doctorData} 
  variant="default"
  index={0}
/>
```

### Empty State
```tsx
<EmptyState
  title="No appointments"
  description="Book your first appointment with a doctor"
  action={{
    label: 'Book Now',
    onClick: () => navigate('/booking')
  }}
/>
```

### Skeleton Grid
```tsx
{loading ? (
  <GridSkeleton count={12} />
) : (
  <div className="grid gap-6">
    {/* Your content */}
  </div>
)}
```

## 🚀 Performance Tips

1. **Use React.memo for expensive components**
```tsx
export const DoctorCard = React.memo(function DoctorCard(props) {
  // Component
})
```

2. **Lazy load images**
```tsx
<img loading="lazy" src={url} alt="description" />
```

3. **Code splitting for pages**
```tsx
const HomePage = lazy(() => import('./pages/home'))
const BookingPage = lazy(() => import('./pages/booking'))
```

4. **Debounce search input**
```tsx
const [search, setSearch] = useState('')
const debouncedSearch = useCallback(
  debounce((value) => {
    // API call
  }, 300),
  []
)
```

## 📁 File Organization

```
src/
├── components/        # React components
├── pages/            # Page components
├── layouts/          # Layout wrappers
├── hooks/            # Custom hooks
├── services/         # API services
├── context/          # React context
├── lib/              # Utilities & animations
├── styles/           # Global styles
├── types/            # TypeScript types
└── App.tsx          # Main app
```

## 🔗 Useful Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Sonner Toast](https://sonner.emilkowal.ski/)

## ✅ Checklist for New Features

- [ ] Use skeleton loaders for loading states
- [ ] Add empty states for zero data
- [ ] Handle errors gracefully
- [ ] Use consistent animations
- [ ] Mobile-first responsive design
- [ ] Accessibility (ARIA labels, semantic HTML)
- [ ] Form validation with Zod
- [ ] Toast notifications for feedback
- [ ] PropTypes/TypeScript definitions
- [ ] Components documented with JSDoc

---

**Created**: May 2026  
**Version**: 1.0.0  
**Framework**: React + TypeScript + Vite
