import { useState } from 'react'
import axios from 'axios'
import './index.css'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setMessage('❌ Mật khẩu nhập lại không khớp!');
      return;
    }
    const endpoint = isLogin ? 'login' : 'register';
    const url = `http://localhost:8080/api/auth/${endpoint}`;

    try {
      const response = await axios.post(url, {
        username: formData.username,
        password: formData.password
      });
      if (isLogin) {
        localStorage.setItem('token', response.data.accessToken);
        setMessage('✅ Đăng nhập thành công!');
      } else {
        setMessage('✅ Đăng ký thành công!');
        setIsLogin(true);
      }
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || 'Lỗi kết nối!'}`);
    }
  }

  return (
    <div className="diagonal-layout">
      <div className="header-navigation-fixed">
        <div className="back-btn-hover" onClick={() => setIsLogin(true)}>
          <i className="bi bi-arrow-left"></i>
        </div>
        <div className="support-tag-hover">
          <i className="bi bi-headset me-2"></i>Gọi hỗ trợ
        </div>
      </div>

      <div className="main-content-row">
        <div className="form-section">
          <div className="form-wrapper-left">
            
            <div className="brand-header text-center mb-5"> 
              <div className="medcare-logo-wrapper justify-content-center mb-3">
                <span className="med-part">Med</span>
                <span className="care-part">Care</span>
              </div>
              <p className="form-subtitle">Hệ thống đặt khám y tế trực tuyến</p>
            </div>

            <h3 className="form-title-text mb-5 text-center">
              {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
            </h3>

            <form onSubmit={handleAuth} className="auth-form">
              {/* Tăng mb-4 thành mb-5 để đẩy cụm mật khẩu xuống xa hơn */}
              <div className="input-group-custom mb-5">
                <label className="input-label">Tài khoản</label>
                <input 
                  name="username" type="text" className="styled-input"
                  placeholder="Nhập tài khoản (Số điện thoại)" onChange={handleChange} required 
                />
              </div>
              
              <div className="input-group-custom mb-5">
                <label className="input-label">Mật khẩu</label>
                <input 
                  name="password" type="password" className="styled-input"
                  placeholder="Nhập mật khẩu" onChange={handleChange} required 
                />
              </div>
              
              {!isLogin && (
                <div className="input-group-custom mb-5">
                  <label className="input-label">Xác nhận mật khẩu</label>
                  <input 
                    name="confirmPassword" type="password" className="styled-input"
                    placeholder="Nhập lại mật khẩu" onChange={handleChange} required 
                  />
                </div>
              )}

              <button type="submit" className="btn-submit-main mt-2 py-3">
                {isLogin ? 'ĐĂNG NHẬP' : 'TIẾP TỤC'}
              </button>
            </form>

            <div className="custom-divider my-5"><span>Hoặc</span></div>

            <button className="btn-google-auth py-3" type="button">
              <img src="https://www.google.com/favicon.ico" width="22" alt="google" />
              Tiếp tục với Google
            </button>

            <p className="footer-switch text-center mt-5">
              {isLogin ? 'Bạn mới biết đến MedCare?' : 'Đã có tài khoản?'} 
              <span className="ms-2 fw-bold link-blue-hover" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? '   Đăng ký ngay' : '   Đăng nhập ngay'}
              </span>
            </p>
          </div>
        </div>

        <div className="image-section-right"></div>
      </div>
    </div>
  )
}

export default App