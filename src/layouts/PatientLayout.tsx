import { Outlet } from 'react-router-dom'
import { PatientLayoutShell } from '@/components/patient/patient-layout-shell'

export function PatientLayout() {
  return (
    <PatientLayoutShell>
      <Outlet />
    </PatientLayoutShell>
  )
}
