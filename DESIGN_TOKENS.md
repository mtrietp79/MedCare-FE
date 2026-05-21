# MedCare Design Tokens Reference

## 🎨 Color System

### Primary Colors
```css
--primary: oklch(0.55 0.175 195);        /* Blue #0a8bd8 - Trust */
--primary-foreground: oklch(1 0 0);      /* White - Foreground */
```

### Secondary Colors
```css
--secondary: oklch(0.95 0.01 240);       /* Light Gray - Backgrounds */
--secondary-foreground: oklch(0.35 0.03 256); /* Dark Gray - Text */
```

### Accent Colors
```css
--accent: oklch(0.72 0.14 160);          /* Cyan #00D4FF - Energy */
--accent-foreground: oklch(0.22 0.02 256); /* Dark - Text on accent */
```

### Semantic Colors
```css
--background: oklch(0.985 0.002 247);    /* Off-white - Page background */
--foreground: oklch(0.22 0.02 256);      /* Dark - Primary text */
--card: oklch(1 0 0);                    /* White - Card background */
--card-foreground: oklch(0.22 0.02 256); /* Dark - Text on card */
--muted: oklch(0.96 0.005 250);          /* Very light - Disabled states */
--muted-foreground: oklch(0.5 0.02 256); /* Gray - Secondary text */
--border: oklch(0.9 0.01 250);           /* Light gray - Borders */
--input: oklch(0.92 0.01 250);           /* Very light - Input backgrounds */
--ring: oklch(0.59 0.17 240);            /* Blue - Focus rings */
--destructive: oklch(0.577 0.245 27.325); /* Red - Errors */
--destructive-foreground: oklch(1 0 0);  /* White - Text on destructive */
```

## 📏 Spacing Scale

| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Compact spacing |
| md | 16px | Default spacing |
| lg | 24px | Generous spacing |
| xl | 32px | Extra spacing |
| 2xl | 48px | Large sections |
| 3xl | 64px | Hero sections |

## 🔤 Typography

### Font Family
```
Primary: Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Mono: Geist Mono, "Courier New", monospace
```

### Font Sizes

| Size | px | Usage |
|------|-----|--------|
| xs | 12px | Captions, small text |
| sm | 14px | Secondary labels |
| base | 16px | Body text, inputs |
| lg | 18px | Emphasized text |
| xl | 20px | Subheadings |
| 2xl | 24px | Section headings |
| 3xl | 30px | Page titles |
| 4xl | 36px | Large headings |
| 5xl | 48px | Hero headings |
| 6xl | 60px | Extra large |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Light | 300 | Subtle text |
| Regular | 400 | Body text |
| Medium | 500 | Emphasis |
| Semibold | 600 | Subheadings |
| Bold | 700 | Headings |

### Line Heights

| Level | Value | Usage |
|-------|-------|-------|
| Tight | 1.2 | Headings |
| Normal | 1.4 | Short text |
| Relaxed | 1.6 | Body text |
| Loose | 1.8 | Captions |

## 🎭 Shadow System

| Size | Value | Usage |
|------|-------|-------|
| sm | 0 1px 2px 0 rgba(0, 0, 0, 0.05) | Subtle depth |
| base | 0 1px 3px 0 rgba(0, 0, 0, 0.1) | Cards |
| md | 0 4px 6px -1px rgba(0, 0, 0, 0.1) | Elevated |
| lg | 0 10px 15px -3px rgba(0, 0, 0, 0.1) | High elevation |
| xl | 0 20px 25px -5px rgba(0, 0, 0, 0.1) | Hover state |
| 2xl | 0 25px 50px -12px rgba(0, 0, 0, 0.25) | Modal |

## 🔘 Border Radius

| Size | Value | Usage |
|------|-------|-------|
| default | 6px | Small elements |
| sm | 4px | Tight elements |
| md | 8px | Standard cards |
| lg | 12px | Large cards |
| xl | 16px | Extra large |
| 2xl | 20px | Oversized |
| 3xl | 24px | Hero sections |
| full | 9999px | Circles, pills |

## ⏱️ Animation System

### Durations

| Name | Duration | Usage |
|------|----------|-------|
| Fast | 150ms | Micro-interactions |
| Base | 300ms | Standard animations |
| Slow | 500ms | Page transitions |
| Slower | 700ms | Heavy animations |
| Slowest | 1000ms | Long sequences |

### Easing Functions

```typescript
// Spring physics (recommended)
type: 'spring'
stiffness: 100  // Light
stiffness: 300  // Medium (default)
stiffness: 500  // Stiff

// Easing curves
'linear'         // No easing
'easeIn'         // Slow start
'easeOut'        // Slow end
'easeInOut'      // Slow both ends
'circIn'         // Circle in
'circOut'        // Circle out
'backIn'         // Anticipate back
'backOut'        // Anticipate out
```

### Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Fade | 300ms | easeOut |
| Slide | 400ms | easeOut |
| Scale | 300ms | spring(300) |
| Rotate | 600ms | linear |
| Pulse | 2000ms | easeInOut |
| Bounce | 800ms | easeInOut |
| Float | 3000ms | easeInOut |

## 📱 Responsive Breakpoints

| Device | Width | CSS |
|--------|-------|-----|
| Mobile | 320px | `@media (min-width: 320px)` |
| Small | 640px | `md:` prefix |
| Medium | 768px | `md:` prefix |
| Large | 1024px | `lg:` prefix |
| XL | 1280px | `xl:` prefix |
| 2XL | 1536px | `2xl:` prefix |

## 🧩 Component Sizing

### Button Sizes

| Size | Padding | Font | Height |
|------|---------|------|--------|
| sm | 8px 12px | 14px | 32px |
| md | 10px 16px | 16px | 40px |
| lg | 12px 24px | 16px | 48px |
| xl | 16px 32px | 18px | 56px |

### Input Heights

| Size | Height | Font | Padding |
|------|--------|------|---------|
| sm | 32px | 14px | 8px 12px |
| md | 40px | 16px | 10px 12px |
| lg | 48px | 16px | 12px 16px |

### Card Dimensions

| Type | Width | Height |
|------|-------|--------|
| Small | 280px | 300px |
| Medium | 360px | 400px |
| Large | 480px | 500px |
| Hero | 100% | 600px |

## 🎪 Icon Sizing

| Size | Dimension | Usage |
|------|-----------|-------|
| xs | 16px | Small badges |
| sm | 20px | Input icons |
| md | 24px | Navigation |
| lg | 32px | Hero sections |
| xl | 48px | Illustrations |
| 2xl | 64px | Large displays |

## 🌐 Z-Index Scale

| Layer | Value | Usage |
|-------|-------|-------|
| Dropdown | 10 | Menus |
| Sticky | 20 | Fixed header |
| Fixed | 30 | Fixed content |
| Modal Backdrop | 40 | Modal background |
| Modal | 50 | Modal content |
| Tooltip | 60 | Floating tooltips |
| Notification | 70 | Toast messages |

## 📏 Grid System

### Desktop (1200px+)
- Columns: 12
- Gutter: 24px
- Max width: 1200px
- Padding: 24px

### Tablet (768px - 1199px)
- Columns: 8
- Gutter: 16px
- Max width: 100%
- Padding: 16px

### Mobile (320px - 767px)
- Columns: 4
- Gutter: 12px
- Max width: 100%
- Padding: 12px

## 🎬 Preset Animation Classes

### Tailwind Animation Classes
```css
animate-spin       /* Rotate 360deg infinite */
animate-pulse      /* Opacity pulse */
animate-bounce     /* Vertical bounce */
animate-ping       /* Scale + fade out */
```

### Framer Motion Variants
```typescript
containerVariants    /* Stagger children */
itemVariants        /* Fade + slide up */
fadeInVariants      /* Simple fade */
slideUpVariants     /* Slide up effect */
cardHoverVariants   /* Card lift + shadow */
floatingVariants    /* Floating motion */
pulseVariants       /* Pulse effect */
pageTransitionVariants /* Page transitions */
```

## 📊 Accessibility Standards

### Color Contrast
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Touch Targets
- Minimum: 44px × 44px
- Recommended: 48px × 48px
- Spacing: 8px minimum between targets

### Focus Indicators
- Color: Primary color (--ring)
- Width: 2px
- Offset: 2px
- Style: Solid

## 🎯 Usage Examples

### Spacing Pattern
```tsx
<div className="px-4 md:px-6 lg:px-8">     {/* Responsive padding */}
  <div className="space-y-4 md:space-y-6"> {/* Responsive gap */}
    {children}
  </div>
</div>
```

### Typography Pattern
```tsx
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
  Heading
</h1>
<p className="text-base md:text-lg text-muted-foreground leading-relaxed">
  Body text
</p>
```

### Card Pattern
```tsx
<div className="rounded-lg md:rounded-xl bg-card border shadow-sm hover:shadow-lg transition-shadow">
  <div className="p-4 md:p-6">
    {content}
  </div>
</div>
```

### Button Pattern
```tsx
<button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
  Action
</button>
```

## 📚 Quick Reference

### Common Patterns

| Pattern | Code |
|---------|------|
| Flex center | `flex items-center justify-center` |
| Flex space-between | `flex items-center justify-between` |
| Grid responsive | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4` |
| Text truncate | `truncate` |
| Line clamp 2 | `line-clamp-2` |
| Hover lift | `hover:-translate-y-1 transition-transform` |

---

**Use these tokens consistently across all MedCare components!**
