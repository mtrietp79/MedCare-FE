import axios from 'axios';

// URL gốc của Backend
const API = axios.create({
  baseURL: 'http://localhost:8080/api/auth',
});

// Hàm gọi API Đăng nhập (trả về Token)
export const loginApi = (data) => API.post('/login', data);

// Hàm gọi API Đăng ký (tạo tài khoản mới)
export const registerApi = (data) => API.post('/register', data);