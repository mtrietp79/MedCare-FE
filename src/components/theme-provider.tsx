import * as React from 'react'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey) || defaultTheme
    }
    return defaultTheme
  })

  React.useEffect(() => {
    const htmlElement = document.documentElement
    htmlElement.classList.remove('light', 'dark')
    htmlElement.classList.add(theme)
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  return <>{children}</>
}

