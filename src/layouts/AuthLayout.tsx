import { Outlet } from 'react-router-dom'
import styles from './auth-layout.module.css'

export function AuthLayout() {
  return (
    <div className={styles.authContainer}>
      <Outlet />
    </div>
  )
}
