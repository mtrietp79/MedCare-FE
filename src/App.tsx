import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
// Import các trang khác sau này nếu có (ví dụ: Register, Home)
// import Home from './pages/Home'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Điều hướng mặc định: Khi vào localhost:5173 sẽ tự động chuyển sang trang /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Đường dẫn tới trang Đăng nhập */}
        <Route path="/login" element={<Login />} />
        
        {/* Đường dẫn tới trang Home (sau khi đăng nhập thành công) */}
        {/* <Route path="/home" element={<Home />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;