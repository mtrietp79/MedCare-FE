import { API_BASE_URL, fetchJson, getStoredToken } from './auth';

export const doctorApi = {
  // Lấy danh sách lịch hẹn của bác sĩ đang đăng nhập
  getAppointments: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/appointments/doctor`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Cập nhật trạng thái cuộc hẹn (ví dụ: đã khám xong)
  updateAppointmentStatus: (id: string, status: string) => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ status })
    });
  }
};