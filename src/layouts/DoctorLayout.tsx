import { Outlet } from 'react-router-dom'
import { DoctorLayout as DoctorLayoutComponent } from '@/components/doctor/doctor-layout'

export function DoctorLayout() {
  return <DoctorLayoutComponent><Outlet /></DoctorLayoutComponent>
}
