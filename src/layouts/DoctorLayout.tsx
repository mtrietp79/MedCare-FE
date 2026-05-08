import { Outlet } from 'react-router-dom'
import { DoctorLayoutComponent } from '@/components/doctor/doctor-layout'

export function DoctorLayout() {
  return <DoctorLayoutComponent><Outlet /></DoctorLayoutComponent>
}