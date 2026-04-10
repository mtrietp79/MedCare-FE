import { useState } from 'react'
import axios from 'axios'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Gửi yêu cầu POST đến API Login của bạn
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username: username,
        password: password
      });

      // Nếu thành công, Backend trả về accessToken
      const token = response.data.accessToken;
      
      // Lưu token vào LocalStorage để các trang sau dùng (như trang Đặt lịch)
      localStorage.setItem('token', token);
      
      setMessage('✅ Đăng nhập thành công! Token đã được lưu.');
      console.log('Token của bạn:', token);
    } catch (error) {
      console.error(error);
      setMessage('❌ Đăng nhập thất bại. Kiểm tra lại tài khoản/mật khẩu!');
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto', fontFamily: 'Arial' }}>
      <h2 style={{ color: '#2c3e50' }}>MedCare - Đăng Nhập 🏥</h2>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Tên đăng nhập:</label>
          <input 
            type="text" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required
          />
        </div>
        
        <div>
          <label>Mật khẩu:</label>
          <input 
            type="password" 
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
        </div>

        <button 
          type="submit" 
          style={{ padding: '10px', background: '#3498db', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Đăng nhập
        </button>
      </form>

      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  )
}

export default App