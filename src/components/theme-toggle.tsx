import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const nextThemeLabel = isDark ? 'chế độ sáng' : 'chế độ tối'

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? 'sm' : 'icon'}
      onClick={toggleTheme}
      className={cn('shrink-0', className)}
      aria-label={`Chuyển sang ${nextThemeLabel}`}
      title={`Chuyển sang ${nextThemeLabel}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel ? <span>{isDark ? 'Chế độ sáng' : 'Chế độ tối'}</span> : <span className="sr-only">Đổi giao diện</span>}
    </Button>
  )
}
