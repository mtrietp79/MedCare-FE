import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, Menu, ChevronDown, User, Calendar, LogOut, BriefcaseMedical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

type AccountMenuItem = {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  isLogout?: boolean
}

const navigation = [
  { name: 'Trang ch\u1EE7', href: '/' },
  { name: 'Chuy\u00ean khoa', href: '/specialty' },
  { name: 'B\u00e1c s\u0129', href: '/doctors' },  { name: 'D\u1ecbch v\u1ee5', href: '/services' },  { name: '\u0110\u1eb7t l\u1ecbch', href: '/booking' },
  { name: 'Li\u00ean h\u1ec7', href: '/contact' },
]

function getAccountMenu(role: string | undefined): AccountMenuItem[] {
  if (role === 'ROLE_ADMIN') {
    return [
      { label: 'Trang qu\u1ea3n tr\u1ecb', href: '/admin', icon: User },
      { label: '\u0110\u0103ng xu\u1ea5t', icon: LogOut, isLogout: true },
    ]
  }

  if (role === 'ROLE_DOCTOR') {
    return [
      { label: 'H\u1ed3 s\u01a1 c\u00e1 nh\u00e2n', href: '/profile', icon: User },
      { label: 'L\u1ecbch l\u00e0m vi\u1ec7c', href: '/doctor/schedule', icon: BriefcaseMedical },
      { label: '\u0110\u0103ng xu\u1ea5t', icon: LogOut, isLogout: true },
    ]
  }

  return [
    { label: 'H\u1ed3 s\u01a1 c\u00e1 nh\u00e2n', href: '/profile', icon: User },
    { label: 'L\u1ecbch kh\u00e1m', href: '/appointments', icon: Calendar },
    { label: '\u0110\u0103ng xu\u1ea5t', icon: LogOut, isLogout: true },
  ]
}

export function Header() {
  const location = useLocation()
  const pathname = location.pathname
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const accountMenu = getAccountMenu(user?.role)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MedCare</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="max-w-[120px] truncate">{user.displayName ?? user.username}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {accountMenu.map((item, index) => {
                    const Icon = item.icon
                    const isLogout = item.isLogout === true
                    const needsSeparator = isLogout && index > 0

                    return (
                      <div key={item.label}>
                        {needsSeparator && <DropdownMenuSeparator />}
                        {item.href ? (
                          <DropdownMenuItem asChild>
                            <Link to={item.href} className="cursor-pointer">
                              <Icon className="w-4 h-4 mr-2" />
                              {item.label}
                            </Link>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={logout} className="text-destructive cursor-pointer">
                            <Icon className="w-4 h-4 mr-2" />
                            {item.label}
                          </DropdownMenuItem>
                        )}
                      </div>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">{'\u0110\u0103ng nh\u1eadp'}</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">{'\u0110\u0103ng k\u00fd'}</Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-primary-foreground" />
                  </div>
                  MedCare
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-4 mt-6">
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        pathname === item.href
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                <div className="border-t pt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <div className="px-4 py-2 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.displayName ?? user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                      </div>

                      {accountMenu.map((item) => {
                        const Icon = item.icon

                        if (item.href) {
                          return (
                            <Link
                              key={item.label}
                              to={item.href}
                              onClick={() => setIsOpen(false)}
                              className="px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2"
                            >
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          )
                        }

                        return (
                          <button
                            key={item.label}
                            onClick={() => {
                              logout()
                              setIsOpen(false)
                            }}
                            className="px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 text-left flex items-center gap-2"
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        )
                      })}
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          {'\u0110\u0103ng nh\u1eadp'}
                        </Link>
                      </Button>
                      <Button asChild className="w-full">
                        <Link to="/register" onClick={() => setIsOpen(false)}>
                          {'\u0110\u0103ng k\u00fd'}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}



