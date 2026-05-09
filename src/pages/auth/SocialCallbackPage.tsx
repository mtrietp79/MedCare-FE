import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function SocialCallbackPage() {
  const nav = useNavigate()

  useEffect(() => {
    // This page should not be reached - use specific Google/Facebook callback pages instead
    nav('/login', { replace: true })
  }, [nav])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-base font-medium">Chuyển hướng...</p>
    </div>
  )
}
