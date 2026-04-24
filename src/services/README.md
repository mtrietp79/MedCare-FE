# API Service Documentation

## Overview

The API service module provides a centralized interface for making HTTP requests to the MedCare backend API running on `http://localhost:8080`.

## Configuration

- **Base URL**: `http://localhost:8080/api`
- **Content-Type**: `application/json`

## Available APIs

### 1. Specialties API (`api.specialties`)

```typescript
// Get all specialties
const specialties = await api.specialties.getAll()

// Get specialty by ID
const specialty = await api.specialties.getById('1')

// Get specialty by slug
const specialty = await api.specialties.getBySlug('tim-mach')

// Create specialty
const specialty = await api.specialties.create({ name: 'Tim mạch', ... })

// Update specialty
const specialty = await api.specialties.update('1', { name: 'New name' })

// Delete specialty
await api.specialties.delete('1')
```

### 2. Doctors API (`api.doctors`)

```typescript
// Get all doctors with optional filters
const doctors = await api.doctors.getAll()
const doctors = await api.doctors.getAll({ specialty: 'tim-mach', search: 'Nguyễn', sort: 'rating' })

// Get doctor by ID
const doctor = await api.doctors.getById('1')

// Get doctors by specialty
const doctors = await api.doctors.getBySpecialty('tim-mach')

// Create doctor
const doctor = await api.doctors.create({ name: 'BS. Nguyễn Văn A', ... })

// Update doctor
const doctor = await api.doctors.update('1', { name: 'New name' })

// Delete doctor
await api.doctors.delete('1')

// Get available slots for doctor
const doctor = await api.doctors.getAvailableSlots('1')
```

### 3. Appointments API (`api.appointments`)

```typescript
// Get all appointments with optional filters
const appointments = await api.appointments.getAll()
const appointments = await api.appointments.getAll({ status: 'confirmed', doctorId: '1' })

// Get appointment by ID
const appointment = await api.appointments.getById('1')

// Create appointment
const appointment = await api.appointments.create({
  doctorId: '1',
  patientName: 'Nguyễn Thị Mai',
  date: '2026-04-02',
  time: '09:00',
  ...
})

// Update appointment
const appointment = await api.appointments.update('1', { time: '10:00' })

// Delete appointment
await api.appointments.delete('1')

// Update appointment status
const appointment = await api.appointments.updateStatus('1', 'confirmed')
```

### 4. Patients API (`api.patients`)

```typescript
// Get all patients
const patients = await api.patients.getAll()

// Get patient by ID
const patient = await api.patients.getById('1')

// Create patient
const patient = await api.patients.create({ name: 'Nguyễn Thị Mai', ... })

// Update patient
const patient = await api.patients.update('1', { name: 'New name' })

// Delete patient
await api.patients.delete('1')
```

### 5. Analytics API (`api.analytics`)

```typescript
// Get monthly patient data
const monthlyData = await api.analytics.getMonthlyPatientData()

// Get patients by specialty
const patientsBySpecialty = await api.analytics.getPatientsBySpecialty()

// Get statistics
const stats = await api.analytics.getStats()
```

## Error Handling

All API methods throw errors if the request fails. Always wrap API calls in try-catch blocks:

```typescript
try {
  const doctors = await api.doctors.getAll()
} catch (error) {
  console.error('Error fetching doctors:', error)
  // Handle error appropriately
}
```

## Usage in Components

```typescript
import { useState, useEffect } from 'react'
import { api } from '@/services/api'

export function MyComponent() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        const data = await api.doctors.getAll()
        setDoctors(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>{doctors.length} doctors found</div>
}
```

## Backend API Endpoints

Make sure your backend API server is running on `http://localhost:8080` and provides the following endpoints:

- `GET /api/specialties` - List all specialties
- `GET /api/specialties/:id` - Get specialty by ID
- `GET /api/specialties/slug/:slug` - Get specialty by slug
- `POST /api/specialties` - Create specialty
- `PUT /api/specialties/:id` - Update specialty
- `DELETE /api/specialties/:id` - Delete specialty

- `GET /api/doctors` - List all doctors (with optional query params: specialty, search, sort)
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors?specialty=:specialty` - Get doctors by specialty
- `POST /api/doctors` - Create doctor
- `PUT /api/doctors/:id` - Update doctor
- `DELETE /api/doctors/:id` - Delete doctor
- `GET /api/doctors/:id/slots` - Get available slots for doctor

- `GET /api/appointments` - List all appointments (with optional query params: status, doctorId, patientId)
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id` - Update appointment status
- `DELETE /api/appointments/:id` - Delete appointment

- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

- `GET /api/analytics/monthly-patients` - Get monthly patient statistics
- `GET /api/analytics/patients-by-specialty` - Get patients by specialty
- `GET /api/analytics/stats` - Get general statistics

## Notes

- Mock data in `/src/lib/mock-data.ts` can be kept as a reference but is no longer used
- All components now fetch data from the backend API
- Remember to keep your backend API server running on `localhost:8080`
