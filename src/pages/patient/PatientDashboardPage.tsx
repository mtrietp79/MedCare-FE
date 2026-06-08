import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  PatientEmptyState,
  PatientPageHeader,
  PatientStatusBadge,
} from '@/components/patient/patient-ui'
import { api } from '@/services/api'
import { PatientProfileForm } from './PatientProfilePage'
import type { Patient, Appointment } from '@/types'
import { resolveAppointmentStatusView } from '@/lib/appointment-status'

function formatAppointmentDateTime(appointment?: Appointment | null): string {
  if (!appointment) return 'Chưa có lịch khám'

  const rawDateSource = String(appointment.appointmentDate || appointment.date || '').trim()
  const rawTimeSource = String(appointment.appointmentTime || appointment.time || '').trim()

  const datePrefixMatch = rawDateSource.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{1,2}:\d{2}))?/)
  const dateSource = (datePrefixMatch?.[1] || rawDateSource).trim()
  const embeddedTime = (datePrefixMatch?.[2] || '').trim()

  const labelTimeCandidate =
    String(appointment.appointmentTimeLabel || '')
      .trim()
      .match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|SA|CH))?$/i)?.[0] || ''
  const timeMatch = (rawTimeSource || embeddedTime || labelTimeCandidate).match(/^(\d{1,2}):(\d{2})/i)
  const timeLabel = timeMatch
    ? `${String(Number(timeMatch[1])).padStart(2, '0')}:${String(Number(timeMatch[2])).padStart(2, '0')}`
    : ''

  const dateObject = dateSource ? new Date(dateSource) : null
  const dateLabel =
    dateObject && !Number.isNaN(dateObject.getTime()) ? dateObject.toLocaleDateString('vi-VN') : dateSource || ''

  if (!dateLabel && !timeLabel) return 'Chưa có lịch khám'
  if (!dateLabel) return timeLabel
  if (!timeLabel) return dateLabel
  return `${dateLabel} ${timeLabel}`
}

export function PatientDashboardPage() {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [patientData, appointmentData] = await Promise.all([
          api.patients.getCurrent(),
          api.appointments.getAll(),
        ])
        setPatient(patientData)
        setAppointments(appointmentData.slice(0, 3))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card p-10 text-center text-muted-foreground">
        Đang tải hồ sơ...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center text-destructive">
        Lỗi: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PatientPageHeader
        title={`Chào mừng trở lại, ${patient?.fullName || patient?.name || 'Bệnh nhân'}`}
        description={
          patient?.profileCompleted
            ? 'Hồ sơ của bạn đã hoàn tất. Theo dõi lịch khám và hồ sơ sức khỏe tại đây.'
            : 'Hoàn thiện hồ sơ để tiếp tục đặt lịch khám.'
        }
        actions={
          <>
            <Button asChild>
              <Link to="/patient/profile">Hồ sơ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/booking">Đặt lịch</Link>
            </Button>
          </>
        }
      />

      {patient?.profileCompleted === false ? (
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Hoàn thiện hồ sơ</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vui lòng cập nhật đầy đủ thông tin để hoàn tất hồ sơ và tiếp tục đặt lịch khám.
              </p>
            </div>
            <PatientProfileForm
              patient={patient}
              onSuccess={(updatedPatient) => setPatient(updatedPatient)}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/10">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="font-medium">Trạng thái hồ sơ</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {patient?.profileCompleted ? 'Hoàn tất' : 'Chưa hoàn tất'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="font-medium">Lịch khám gần nhất</p>
            </div>
            <p className="text-sm font-medium text-foreground">
              {appointments.length > 0 ? formatAppointmentDateTime(appointments[0]) : 'Chưa có lịch khám'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/10">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <p className="font-medium">Thông tin liên hệ</p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {patient?.phone || 'Chưa cập nhật'}
            </p>
            <p className="text-sm text-muted-foreground">{patient?.email || 'Chưa cập nhật email'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Lịch khám gần đây</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Theo dõi lịch sử khám và mã vé ngay tại đây.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/patient/appointments" className="gap-2">
                Xem toàn bộ
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {appointments.length === 0 ? (
            <PatientEmptyState
              icon={CalendarDays}
              message="Bạn chưa có lịch khám nào. Hãy đặt lịch để chúng tôi phục vụ."
              action={
                <Button asChild className="mt-2">
                  <Link to="/booking">Đặt lịch khám</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3">
              {appointments.map((appointment) => {
                const statusView = resolveAppointmentStatusView(appointment.status, appointment.statusDisplay)
                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 transition-colors hover:border-primary/25 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {appointment.appointmentCode || `#${appointment.id}`}
                      </p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {appointment.doctor?.fullName || appointment.doctorName || 'Bác sĩ chưa xác định'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {typeof appointment.specialty === 'string'
                          ? appointment.specialty
                          : appointment.specialty?.name || 'Chuyên khoa'}
                        {' · '}
                        {formatAppointmentDateTime(appointment)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <PatientStatusBadge label={statusView.label} className={statusView.className} />
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/patient/appointments/${appointment.id}`}>Xem chi tiết</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
