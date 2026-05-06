import { API_BASE_URL, fetchJson, getStoredToken } from './auth';

export const adminApi = {
  // Lấy tóm tắt dashboard
  getSummary: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  // Quản lý thuốc
  getMedicines: () => {
    const token = getStoredToken();
    return fetchJson(`${API_BASE_URL}/medicines`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};