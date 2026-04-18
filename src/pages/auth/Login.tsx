import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { GoogleOutlined, ArrowRightOutlined, FacebookOutlined } from '@ant-design/icons';
import { loginApi } from '../../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Import file CSS

// Định nghĩa interface cho dữ liệu form
interface LoginValues {
  gmail: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();

  // Định kiểu cho hàm onFinish
  const onFinish = async (values: LoginValues) => {
    try {
      const response = await loginApi(values);
      if (response.status === 200) {
        localStorage.setItem('token', response.data.accessToken);
        message.success('Đăng nhập thành công!');
        navigate('/home'); 
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Sai gmail hoặc mật khẩu!';
      message.error(errorMsg);
    }
  };

  return (
    <div className="auth-container">
      {/* Bên trái: Form */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          {/* Logo MEDCARE */}
          <div className="auth-header">
            <h1 className="auth-title">MEDCARE</h1>
            <p className="auth-subtitle">Đặt khám nhanh</p>
          </div>

          <Form name="login_form" layout="vertical" onFinish={onFinish}>
            <Form.Item name="gmail" rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}>
              <Input placeholder="Nhập gmail" size="large" className="custom-input" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
              <Input.Password placeholder="Nhập mật khẩu" size="large" className="custom-input" />
            </Form.Item>

            {/* Quên mật khẩu? */}
            <div className="forgot-password-wrapper">
              <Link to="/forgot-password" className="forgot-password-link">Quên mật khẩu?</Link>
            </div>

            {/* Nút Đăng nhập */}
            <Button type="primary" htmlType="submit" block size="large" className="btn-primary-blue">
              Đăng nhập
            </Button>
          </Form>

          {/* Login xã hội */}
          <div className="social-divider">Hoặc đăng nhập bằng</div>
          
          <div className="social-buttons">
            <Button icon={<GoogleOutlined />} className="btn-google">
              Google
            </Button>
            <Button icon={<FacebookOutlined />} className="btn-facebook">
              Facebook
            </Button>
          </div>

          {/* Chuyển sang Đăng ký */}
          <div className="register-wrapper">
            <Link to="/register" className="register-link">
              Đăng ký ngay <ArrowRightOutlined />
            </Link>
          </div>
        </div>
      </div>

      {/* Bên phải: Chỗ để thêm hình ảnh */}
      <div className="auth-image-side">
        <div className="image-placeholder">
          Thêm 1 hình ảnh ở đây
        </div>
      </div>
    </div>
  );
};

export default Login;