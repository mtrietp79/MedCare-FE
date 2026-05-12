# MedCare Frontend API Integration Guide

## Overview

This guide documents the migration from mock data to real Backend API integration for the MedCare Frontend.

## Configuration

### Environment Variables (.env)

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_URL=http://localhost:8080/api
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_MOCK_AUTH=false
```

## API Architecture

### Base URL
- **Development**: `http://localhost:8080/api`
- **Headers**: All requests include `Authorization: Bearer <JWT_TOKEN>`

### Authentication

The application handles JWT token management automatically:
- Tokens are stored in `localStorage` under key `medcare_access_token`
- All API requests automatically attach the token from localStorage
- On 401/403 errors, user is redirected to `/login` and token is cleared

### Error Handling

- **401 Unauthorized**: Token expired or invalid - redirects to login
- **403 Forbidden**: User lacks permissions - shows error message
- **Other errors**: Displays friendly error messages to users

## Page Integration Status

### ✅ Completed

#### Home Page Components
- **FeaturedDoctors** - Fetches from `GET /api/doctors`, sorts by rating
- **SpecialtySection** - Fetches from `GET /api/specialties`

#### Patient Pages  
- **PatientDashboard** - Fetches patient info and appointments
- **PatientAppointmentsPage** - Lists all patient appointments

#### Specialty Pages
- **SpecialtyDetailPage** - Fetches specialty info and related doctors

#### Doctor Pages (NEW)
- **DoctorsPage** - Fetches all doctors with filtering and sorting
- **DoctorCard** - Displays doctor details
- **DoctorFilter** - Filter by specialty, search, and sort

#### Specialty Pages (NEW)
- **SpecialtyPage** - Lists all specialties with API data

### ✅ Working (Admin)

#### Admin Pages
- **AdminDashboard** - Uses `GET /api/dashboard/summary`, `recent-appointments`, `revenue-chart`
- **AdminDoctorsPage** - CRUD operations on doctors
- **AdminSpecialtiesPage** - CRUD operations on specialties
- **Doctor Dashboard** - Shows doctor-specific statistics
- **Doctor Appointments** - Lists and manages appointments

## Available Endpoints

### Doctors
```typescript
api.doctors.getAll(query?: { specialty?, search?, sort? })  // GET /api/doctors
api.doctors.getById(id)                                      // GET /api/doctors/:id
api.doctors.getBySpecialty(specialty)                        // GET /api/doctors?specialty=...
api.doctors.create(data)                                     // POST /api/doctors
api.doctors.update(id, data)                                 // PUT /api/doctors/:id
api.doctors.delete(id)                                       // DELETE /api/doctors/:id
api.doctors.getAvailableSlots(doctorId, date)               // GET /api/appointments/doctor/:id/slots?date=...
```

### Specialties
```typescript
api.specialties.getAll()                          // GET /api/specialties
api.specialties.getById(id)                       // GET /api/specialties/:id
api.specialties.getBySlug(slug)                   // Filters getAll by slug
api.specialties.create(data)                      // POST /api/specialties
api.specialties.update(id, data)                  // PUT /api/specialties/:id
api.specialties.delete(id)                        // DELETE /api/specialties/:id
```

### Appointments
```typescript
api.appointments.getAll(query?: { status?, doctorId?, patientId? })  // GET /api/appointments
api.appointments.getById(id)                                          // GET /api/appointments/:id
api.appointments.create(data)                                         // POST /api/appointments
api.appointments.update(id, data)                                     // PUT /api/appointments/:id
api.appointments.updateStatus(id, status)                             // PATCH /api/appointments/:id
api.appointments.delete(id)                                           // DELETE /api/appointments/:id
api.appointments.reschedule(id, { appointmentDate })                  // POST /api/appointments/:id/reschedule
```

### Patients
```typescript
api.patients.getAll()                    // GET /api/patients
api.patients.getById(id)                 // GET /api/patients/:id
api.patients.getCurrent()                // GET /api/patients/me
api.patients.create(data)                // POST /api/patients
api.patients.update(id, data)            // PUT /api/patients/:id
api.patients.updateCurrent(data)         // PUT /api/patients/me
api.patients.delete(id)                  // DELETE /api/patients/:id
```

### Medicines
```typescript
api.medicines.getAll()                   // GET /api/medicines
api.medicines.getById(id)                // GET /api/medicines/:id
api.medicines.create(data)               // POST /api/medicines
api.medicines.update(id, data)           // PUT /api/medicines/:id
api.medicines.delete(id)                 // DELETE /api/medicines/:id
```

### Dashboard
```typescript
api.dashboard.getSummary()               // GET /api/dashboard/summary
api.dashboard.getRecentAppointments()    // GET /api/dashboard/recent-appointments
api.dashboard.getRevenueChart()          // GET /api/dashboard/revenue-chart
```

### Schedules
```typescript
api.schedules.getAll()                   // GET /api/schedules
api.schedules.create(data)               // POST /api/schedules
api.schedules.update(id, data)           // PUT /api/schedules/:id
api.schedules.delete(id)                 // DELETE /api/schedules/:id
```

### Analytics
```typescript
api.analytics.getMonthlyPatientData()    // GET /api/analytics/monthly-patients
api.analytics.getPatientsBySpecialty()   // GET /api/analytics/patients-by-specialty
api.analytics.getStats()                 // GET /api/analytics/stats
```

### Payments
```typescript
api.payments.initiateMoMoPayment(data)   // POST /api/payments/momo/initiate
api.payments.verifyMoMoPayment(data)     // POST /api/payments/momo/verify
api.payments.initiateVNPayPayment(data)  // POST /api/payments/vnpay/initiate
api.payments.getPaymentStatus(appointmentId) // GET /api/payments/:appointmentId/status
```

## Data Structures

### Doctor
```typescript
interface Doctor {
  id: string
  fullName?: string          // Doctor's full name
  specialty?: {              // Nested specialty object
    id?: string
    name?: string
    slug?: string
  }
  specialtyId?: string
  experience?: number        // Years of experience
  rating?: number            // Star rating (0-5)
  reviewCount?: number       // Number of reviews
  fee?: number              // Consultation fee in VND
  avatar?: string           // Avatar URL
  qualifications?: string[]
  bio?: string
  email?: string
  phone?: string
}
```

### Specialty
```typescript
interface Specialty {
  id: string
  name: string              // Specialty name
  slug: string              // URL-friendly name
  description?: string      // Detailed description
  icon?: string            // Icon reference
  doctorCount?: number     // Number of doctors in specialty
}
```

### Appointment
```typescript
interface Appointment {
  id: string
  appointmentCode?: string
  appointmentDate: string   // ISO format: YYYY-MM-DD
  patient?: {
    id?: string
    fullName?: string
  }
  doctor?: {
    id?: string
    fullName?: string
  }
  specialty?: {
    id?: string
    name?: string
  }
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  paymentStatus?: string
  notes?: string
  createdAt?: string
}
```

### Patient
```typescript
interface Patient {
  id: string
  fullName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  address?: string
  profileCompleted?: boolean
  appointmentCount?: number
  lastVisit?: string
}
```

## Loading States

All pages implement proper loading states:
- **Loading**: Skeleton loaders or spinner
- **Error**: Error message with retry button
- **Empty**: Empty state message
- **Success**: Data display

Example component pattern:
```tsx
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await api.endpoint.getAll()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])

return (
  <>
    {loading && <LoadingSpinner />}
    {error && <ErrorMessage message={error} />}
    {!loading && !error && data.length === 0 && <EmptyState />}
    {!loading && !error && data.length > 0 && <DataDisplay data={data} />}
  </>
)
```

## Testing the Integration

### 1. Verify Backend is Running
```bash
# Backend should be running on http://localhost:8080
curl http://localhost:8080/api/specialties
```

### 2. Check Token Storage
Open DevTools Console:
```js
// Should return token if logged in
localStorage.getItem('medcare_access_token')
```

### 3. Test Doctor List Page
1. Navigate to `/doctors`
2. Verify doctors are loaded from API
3. Test filtering by specialty
4. Test search functionality
5. Test sorting options

### 4. Test Specialty Page
1. Navigate to `/specialty`
2. Verify specialties load from API
3. Click on a specialty to view doctors

### 5. Test Admin Dashboard
1. Login as admin
2. Navigate to admin dashboard
3. Verify summary statistics load
4. Check recent appointments list
5. Verify revenue chart displays

### 6. Test Error Scenarios
1. Stop backend server
2. Try to load page - should show error
3. Restart backend
4. Click retry - should reload

## Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Backend should have `@CrossOrigin("*")` configured. If still occurring, check browser console for exact error.

### Issue: 401 Unauthorized
**Solution**: Token might be expired or invalid. Clear localStorage and login again:
```js
localStorage.removeItem('medcare_access_token')
```

### Issue: Data Not Loading
**Solution**: 
1. Check backend is running: `http://localhost:8080`
2. Open DevTools Network tab to see API requests
3. Verify response format matches expected interface
4. Check error message in console

### Issue: Filtering/Sorting Not Working
**Solution**: 
1. Verify API supports the query parameters
2. Check query parameter formatting in API call
3. Ensure data structure matches expectations

## Migration Checklist

- [x] Configure .env with API_BASE_URL
- [x] Add dashboard endpoints to api.ts
- [x] Add medicines endpoints to api.ts
- [x] Update DoctorsPage to use API
- [x] Update SpecialtyPage to use API
- [x] Verify home page components use API
- [ ] Test all pages with real backend
- [ ] Verify error handling works (401/403)
- [ ] Test loading states and spinners
- [ ] Verify pagination if implemented
- [ ] Test search and filter functionality
- [ ] Test CRUD operations in admin pages

## Next Steps

1. **Start Backend**: Ensure backend runs on http://localhost:8080
2. **Login**: Authenticate with test account
3. **Test Pages**: Verify each page loads data correctly
4. **Monitor**: Use DevTools Network tab to monitor API calls
5. **Report**: Note any data structure mismatches
6. **Iterate**: Update as needed based on backend responses

## Support

For questions about API integration, check:
1. Backend API Documentation
2. Type definitions in `src/types/index.ts`
3. Service implementations in `src/services/`
4. Example pages for pattern reference

---
Last Updated: May 11, 2026
