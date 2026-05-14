# MedCare UI Component Showcase

## Loading States

### Skeleton Loaders

#### Doctor Card Skeleton
```tsx
import { DoctorCardSkeleton } from '@/components/ui/skeleton-loader'

export function DoctorsLoading() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <DoctorCardSkeleton key={i} />
      ))}
    </div>
  )
}
```

**Use Case**: While loading doctor list

#### Grid Skeleton
```tsx
import { GridSkeleton } from '@/components/ui/skeleton-loader'

export function MyComponent() {
  const { data, loading } = useFetchData()
  
  if (loading) return <GridSkeleton count={12} />
  
  return <DataGrid data={data} />
}
```

**Use Case**: Grid/table loading states

#### Form Skeleton
```tsx
import { FormSkeleton } from '@/components/ui/skeleton-loader'

export function FormLoading() {
  return <FormSkeleton />
}
```

**Use Case**: Form loading before rendering

#### Page Header Skeleton
```tsx
import { PageHeaderSkeleton } from '@/components/ui/skeleton-loader'

export function PageWithHeader() {
  return (
    <>
      <PageHeaderSkeleton />
      <GridSkeleton count={6} />
    </>
  )
}
```

## Empty States

### EmptyState Component
```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { Search } from 'lucide-react'

export function NoResults() {
  return (
    <EmptyState
      icon={<Search className="w-16 h-16" />}
      title="No results found"
      description="Try adjusting your search criteria"
      action={{
        label: 'Clear filters',
        onClick: () => setFilters({}),
      }}
    />
  )
}
```

### Pre-built Empty States

#### EmptyAppointments
```tsx
import { EmptyAppointments } from '@/components/ui/empty-state'

export function AppointmentsList() {
  if (appointments.length === 0) {
    return <EmptyAppointments />
  }
  return <AppointmentGrid appointments={appointments} />
}
```

**Message**: "Không có lịch hẹn nào" with book appointment action

#### EmptySearch
```tsx
import { EmptySearch } from '@/components/ui/empty-state'

export function SearchResults() {
  if (results.length === 0) {
    return <EmptySearch />
  }
  return <ResultsList results={results} />
}
```

**Message**: "Không tìm thấy kết quả"

#### EmptyFavorites
```tsx
import { EmptyFavorites } from '@/components/ui/empty-state'

export function FavoritesList() {
  if (favorites.length === 0) {
    return <EmptyFavorites />
  }
  return <FavoritesGrid favorites={favorites} />
}
```

**Message**: "Không có bác sĩ yêu thích"

## Error States

### ErrorState Component
```tsx
import { ErrorState } from '@/components/ui/empty-state'

export function DataDisplay() {
  if (error) {
    return (
      <ErrorState
        title="Đã xảy ra lỗi"
        description={error}
        action={{
          label: 'Thử lại',
          onClick: () => retry(),
        }}
      />
    )
  }
  
  return <DataGrid data={data} />
}
```

## Animated Components

### Hero Section
```tsx
import { HeroSection } from '@/components/home/hero-section'

// Full-featured hero with:
// - Animated background elements
// - Floating cards
// - Search bar
// - Quick stats
<HeroSection />
```

### Doctor Card
```tsx
import { DoctorCard } from '@/components/doctors/doctor-card'
import type { Doctor } from '@/types'

const doctor: Doctor = {
  id: '1',
  name: 'Dr. John Doe',
  specialty: 'Cardiology',
  rating: 4.8,
  experience: 10,
  hospital: 'City Hospital',
  consultationFee: 500000,
}

// Default variant (full card)
<DoctorCard doctor={doctor} index={0} />

// Compact variant (minimal card)
<DoctorCard doctor={doctor} variant="compact" />
```

### Page Wrapper
```tsx
import { PageWrapper } from '@/components/ui/page-wrapper'

export function MyPage() {
  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Page content with smooth transitions */}
      </div>
    </PageWrapper>
  )
}
```

**Features**:
- Fade in on mount
- Slide up animation
- Smooth exit transitions
- Optional delay parameter

### Section Wrapper
```tsx
import { SectionWrapper } from '@/components/ui/page-wrapper'

export function HomePage() {
  return (
    <>
      <SectionWrapper>
        <HeroSection />
      </SectionWrapper>
      
      <SectionWrapper delay={0.1}>
        <SpecialtySection />
      </SectionWrapper>
      
      <SectionWrapper delay={0.2}>
        <FeaturedDoctors />
      </SectionWrapper>
    </>
  )
}
```

## Complete Page Example

### Doctor Listing Page
```tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { GridSkeleton } from '@/components/ui/skeleton-loader'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { api } from '@/services/api'
import type { Doctor } from '@/types'

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await api.doctors.getAll()
        setDoctors(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load doctors')
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Danh sách bác sĩ
          </h1>
          <p className="text-muted-foreground text-lg">
            Chọn bác sĩ phù hợp cho nhu cầu của bạn
          </p>
        </motion.div>

        {loading && <GridSkeleton count={12} />}

        {error && (
          <ErrorState
            title="Không thể tải bác sĩ"
            description={error}
            action={{
              label: 'Thử lại',
              onClick: () => window.location.reload(),
            }}
          />
        )}

        {!loading && !error && doctors.length === 0 && (
          <EmptyState
            title="Không có bác sĩ"
            description="Danh sách bác sĩ hiện chưa có sẵn"
          />
        )}

        {!loading && !error && doctors.length > 0 && (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
          >
            {doctors.map((doctor, index) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
```

## Form Example

### Booking Form
```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormSkeleton } from '@/components/ui/skeleton-loader'
import { toast } from 'sonner'

const bookingSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
})

export function BookingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading] = useState(false)
  
  const { register, formState: { errors }, handleSubmit } = useForm({
    resolver: zodResolver(bookingSchema),
  })

  const onSubmit = async (data: z.infer<typeof bookingSchema>) => {
    try {
      setIsSubmitting(true)
      // API call
      toast.success('Booking successful!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <FormSkeleton />

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium">
          Select Doctor
        </label>
        <select
          {...register('doctorId')}
          className="w-full px-4 py-2 rounded-lg border bg-card"
        >
          <option value="">Choose a doctor...</option>
          {/* Options */}
        </select>
        {errors.doctorId && (
          <p className="text-destructive text-sm">{errors.doctorId.message}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium">
          Appointment Date
        </label>
        <Input
          type="date"
          {...register('date')}
        />
        {errors.date && (
          <p className="text-destructive text-sm">{errors.date.message}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium">
          Time Slot
        </label>
        <Input
          type="time"
          {...register('time')}
        />
        {errors.time && (
          <p className="text-destructive text-sm">{errors.time.message}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <label className="block text-sm font-medium">
          Notes (Optional)
        </label>
        <textarea
          {...register('notes')}
          className="w-full px-4 py-2 rounded-lg border bg-card"
          rows={4}
          placeholder="Any additional information..."
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Booking...' : 'Confirm Booking'}
        </Button>
      </motion.div>
    </motion.form>
  )
}
```

## Tips & Tricks

### Reusing Animations
```tsx
import {
  containerVariants,
  itemVariants,
  cardHoverVariants,
  floatingVariants,
} from '@/lib/animations'

// Combine animations for custom effects
const customVariants = {
  ...containerVariants,
  visible: {
    ...containerVariants.visible,
    transition: {
      ...containerVariants.visible.transition,
      staggerChildren: 0.15, // Custom stagger
    },
  },
}
```

### Conditional Animations
```tsx
<motion.div
  animate={isOpen ? { height: 'auto' } : { height: 0 }}
  initial={false}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

### Progressive Enhancement
```tsx
// Start with skeleton
if (loading) return <GridSkeleton count={6} />

// Show error state
if (error) return <ErrorState />

// Show empty state
if (data.length === 0) return <EmptyState />

// Show data with animations
return <DataGrid data={data} />
```

## Performance Tips

1. **Use React.memo for list items**
   ```tsx
   const DoctorCardMemoized = React.memo(DoctorCard)
   ```

2. **Virtualize long lists**
   ```tsx
   import { FixedSizeList } from 'react-window'
   ```

3. **Debounce expensive animations**
   ```tsx
   const debouncedAnimation = useCallback(
     debounce(() => setAnimationTrigger(true), 300),
     []
   )
   ```

---

**For more examples and patterns, check DEVELOPER_GUIDE.md**
