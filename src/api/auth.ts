import axios from 'axios';

// URL gốc của Backend
const API = axios.create({
  baseURL: 'http://localhost:8080/api/auth',
});

// Hàm gọi API Đăng nhập
export const loginApi = (data: any) => API.post('/login', data);

// Hàm gọi API Đăng ký
export const registerApi = (data: any) => API.post('/register', data);