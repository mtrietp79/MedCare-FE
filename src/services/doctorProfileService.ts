import { doctorApiClient } from './doctorApiClient'

export interface DoctorProfileResponse {
  id?: string
  fullName?: string
  email?: string
  phone?: string
  specialtyName?: string
  specialty?: string | { id?: string; name?: string }
  address?: string
  experienceYears?: number
  experience?: string
  bio?: string
  createdAt?: string | null
  rating?: number | null
  avatarUrl?: string | null
  imageUrl?: string | null
  photoUrl?: string | null
}

export interface UpdateDoctorProfilePayload {
  fullName: string
  phone: string
  address: string
  experienceYears: number
  bio: string
}

export const doctorProfileService = {
  async getProfile() {
    const { data } = await doctorApiClient.get<DoctorProfileResponse>('/doctor/profile')
    return data ?? {}
  },

  async updateProfile(payload: UpdateDoctorProfilePayload) {
    const { data } = await doctorApiClient.put('/doctor/profile', payload)
    return data
  },

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await doctorApiClient.post('/doctor/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async deleteAvatar() {
    const { data } = await doctorApiClient.delete('/doctor/profile/avatar')
    return data
  },
}
