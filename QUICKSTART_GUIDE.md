# MedCare Frontend - Quick Start Guide

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup

Create `.env.local`:
```env
VITE_API_URL=http://localhost:3000/api
```

## 📁 Project Structure

```
medcare-fe/
├── src/
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── home/               # Home page sections
│   │   ├── doctors/            # Doctor-related
│   │   ├── booking/            # Booking system
│   │   ├── auth/               # Authentication
│   │   ├── admin/              # Admin dashboard
│   │   ├── layout/             # Layout components
│   │   └── payment/            # Payment components
│   ├── pages/                  # Page components
│   ├── layouts/                # Layout wrappers
│   ├── hooks/                  # Custom hooks
│   ├── services/               # API services
│   ├── context/                # React context
│   ├── lib/
│   │   ├── animations.ts       # Framer Motion presets
│   │   ├── api-client.ts       # API client
│   │   ├── utils.ts            # Utilities
│   │   └── mock-data.ts        # Mock data
│   ├── types/                  # TypeScript types
│   ├── styles/                 # Global styles
│   ├── App.tsx                 # Main app
│   └── main.tsx                # Entry point
├── public/                     # Static assets
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── postcss.config.mjs         # PostCSS config
└── tailwind.config.js         # Tailwind config
```

## 🎨 Design System

### Color Palette

| Name | Color | Usage |
|------|-------|-------|
| Primary | `#0084FF` (Blue) | Buttons, links, primary actions |
| Secondary | `#F5F7FA` | Backgrounds, secondary elements |
| Accent | `#00D4FF` (Cyan) | Highlights, icons, accents |
| Destructive | `#FF4444` | Errors, delete actions |
| Foreground | `#1A1A1A` | Text, primary content |
| Muted | `#666666` | Secondary text, disabled state |

### Typography

- **Heading 1**: 48px, bold, line-height 1.2
- **Heading 2**: 32px, bold, line-height 1.3
- **Heading 3**: 24px, semibold, line-height 1.4
- **Body**: 16px, regular, line-height 1.6
- **Small**: 14px, regular, line-height 1.5
- **Caption**: 12px, regular, line-height 1.4

### Spacing

- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

## 🎬 Animation System

### Preset Animations Available

1. **Container Animations** - For staggered item animations
2. **Item Animations** - Fade in + slide up effect
3. **Page Transitions** - Page enter/exit effects
4. **Card Hover Effects** - Lift and shadow on hover
5. **Floating Animations** - Subtle floating motion
6. **Pulse Animations** - Scale pulse effect
7. **Loading Spinners** - Rotating animation

### Using Animations

```typescript
import { containerVariants, itemVariants } from '@/lib/animations'

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
```

## 📦 Component Library

### Essential Components

| Component | Location | Use Case |
|-----------|----------|----------|
| `Button` | `ui/button.tsx` | All clickable buttons |
| `Card` | `ui/card.tsx` | Content containers |
| `Input` | `ui/input.tsx` | Text inputs |
| `Select` | `ui/select.tsx` | Dropdowns |
| `Badge` | `ui/badge.tsx` | Tags, labels |
| `Dialog` | `ui/dialog.tsx` | Modals |
| `Toast` | `sonner` | Notifications |

### Enhanced Components

| Component | Location | Features |
|-----------|----------|----------|
| `DoctorCardSkeleton` | `ui/skeleton-loader.tsx` | Animated loading |
| `EmptyState` | `ui/empty-state.tsx` | Zero-data states |
| `ErrorState` | `ui/empty-state.tsx` | Error handling |
| `PageWrapper` | `ui/page-wrapper.tsx` | Page transitions |
| `DoctorCard` | `doctors/doctor-card.tsx` | Doctor display |

## 🎯 Quick Component Usage

### Doctor Card
```tsx
import { DoctorCard } from '@/components/doctors/doctor-card'

<DoctorCard doctor={doctor} variant="default" index={0} />
```

### Skeleton Loader
```tsx
import { GridSkeleton } from '@/components/ui/skeleton-loader'

{loading && <GridSkeleton count={6} />}
```

### Empty State
```tsx
import { EmptyState } from '@/components/ui/empty-state'

{data.length === 0 && <EmptyState title="No data" />}
```

### Page Wrapper
```tsx
import { PageWrapper } from '@/components/ui/page-wrapper'

<PageWrapper>
  <h1>My Page</h1>
  {/* Content */}
</PageWrapper>
```

## 🔄 Data Fetching Pattern

```typescript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await api.endpoint.getAll()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])

// Render
return (
  <>
    {loading && <GridSkeleton />}
    {error && <ErrorState description={error} />}
    {!loading && data.length === 0 && <EmptyState />}
    {!loading && !error && <DataGrid data={data} />}
  </>
)
```

## 📝 Form Handling

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function MyForm() {
  const { register, formState: { errors }, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}
    </form>
  )
}
```

## 🔔 Notifications

```typescript
import { toast } from 'sonner'

// Success
toast.success('Success!', { description: 'Operation completed' })

// Error
toast.error('Error', { description: 'Something went wrong' })

// Loading
const id = toast.loading('Processing...')
toast.dismiss(id)
toast.success('Done!')
```

## 📱 Responsive Breakpoints

| Device | Breakpoint | Grid |
|--------|-----------|------|
| Mobile | < 640px | 1 column |
| Tablet | 640px - 1024px | 2 columns |
| Desktop | > 1024px | 3-4 columns |

### Using Tailwind Responsive Classes

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  {/* 1 col mobile, 2 col tablet, 4 col desktop */}
</div>
```

## 🎓 Development Workflow

### 1. Create New Page
```bash
# Create page component with proper structure
```

```typescript
// pages/my-page.tsx
import { useEffect, useState } from 'react'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GridSkeleton } from '@/components/ui/skeleton-loader'
import { ErrorState, EmptyState } from '@/components/ui/empty-state'

export function MyPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch data
  }, [])

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Page Title</h1>
        
        {loading && <GridSkeleton count={6} />}
        {error && <ErrorState description={error} />}
        {!loading && data.length === 0 && <EmptyState />}
        {!loading && !error && <DataDisplay data={data} />}
      </div>
    </PageWrapper>
  )
}
```

### 2. Add to Router
```typescript
// App.tsx
<Route element={<MainLayout />}>
  <Route path="/my-page" element={<MyPage />} />
</Route>
```

### 3. Create Navigation Link
```typescript
// components/layout/header.tsx
<Link to="/my-page" className="text-primary hover:underline">
  My Page
</Link>
```

## 🔗 Important Files to Know

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main routing |
| `src/lib/animations.ts` | Animation presets |
| `src/services/api.ts` | API client |
| `src/context/AuthContext.tsx` | Auth state |
| `src/types/index.ts` | TypeScript types |
| `tailwind.config.js` | Design tokens |
| `vite.config.ts` | Build config |

## 🚨 Common Issues & Solutions

### Issue: Animations not smooth
**Solution**: Ensure animations are under 600ms. Check `transition.duration`.

### Issue: Skeleton not appearing
**Solution**: Import from `@/components/ui/skeleton-loader`, not `@/components/ui/skeleton`.

### Issue: Form validation not working
**Solution**: Ensure Zod schema matches form fields and use `zodResolver`.

### Issue: Empty state not showing
**Solution**: Check data.length === 0 condition. Ensure proper state management.

## 📚 Documentation Links

- [MODERN_UI_GUIDE.md](./MODERN_UI_GUIDE.md) - Complete design system
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - Development best practices
- [COMPONENT_SHOWCASE.md](./COMPONENT_SHOWCASE.md) - Component examples
- [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) - API integration
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind Docs](https://tailwindcss.com/)

## 💡 Tips for Success

1. ✅ Always include loading/error/empty states
2. ✅ Use consistent animation presets from `lib/animations.ts`
3. ✅ Follow mobile-first responsive design
4. ✅ Keep components small and reusable
5. ✅ Use TypeScript for type safety
6. ✅ Test components on multiple devices
7. ✅ Use semantic HTML for accessibility
8. ✅ Document complex component logic

## 🎉 You're Ready!

Start building amazing UI components for MedCare. Remember:
- **Clean code** is happy code
- **Animations** enhance, not distract
- **Mobile first** matters
- **User experience** is everything

Happy coding! 🚀
