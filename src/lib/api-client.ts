import { getStoredToken, removeStoredToken, removeStoredUser } from '@/services/auth';

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`http://localhost:8080/api${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeStoredToken();
    removeStoredUser();
    window.location.href = '/login';
    throw new Error('Hết phiên làm việc, vui lòng đăng nhập lại.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Có lỗi xảy ra');
  }

  return response.json();
}