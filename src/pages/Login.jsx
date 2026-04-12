import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { GoogleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { loginApi } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const response = await loginApi(values);
      if (response.status === 200) {
        // Lưu token vào localStorage để dùng cho các trang sau
        localStorage.setItem('token', response.data.accessToken);
        message.success('Đăng nhập thành công!');
        navigate('/home'); // Chuyển sang trang chủ sau khi login
      }
    } catch (error) {
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
          <div style={{ marginBottom: 30 }}>
            <h1 style={{ color: '#00a3ff', margin: 0, fontSize: 36 }}>MEDCARE</h1>
            <p style={{ color: '#00a3ff', margin: 0 }}>Đặt khám nhanh</p>
          </div>

          <Form name="login_form" layout="vertical" onFinish={onFinish}>
            {/* Input Gmail */}
            <Form.Item name="gmail" rules={[{ required: true, message: 'Vui lòng nhập Email!' }]}>
              <Input placeholder="Nhập gmail" size="large" className="custom-input" />
            </Form.Item>

            {/* Input Mật khẩu */}
            <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
              <Input.Password placeholder="Nhập mật khẩu" size="large" className="custom-input" />
            </Form.Item>

            {/* Quên mật khẩu? */}
            <div style={{ marginBottom: 20, textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ color: '#333', fontSize: 13 }}>Quên mật khẩu?</Link>
            </div>

            {/* Nút Đăng nhập */}
            <Button type="primary" htmlType="submit" block size="large" className="btn-primary-blue">
              Đăng nhập
            </Button>
          </Form>

          {/* Login xã hội */}
          <div style={{ marginTop: 25, marginBottom: 25, color: '#666' }}>Hoặc đăng nhập bằng</div>
          <Button icon={<GoogleOutlined />} className="btn-google">
            Google
          </Button>

          {/* Chuyển sang Đăng ký */}
          <div style={{ marginTop: 30 }}>
            <Link to="/register" style={{ color: '#333' }}>
              Đăng ký ngay <ArrowRightOutlined />
            </Link>
          </div>
        </div>
      </div>

      {/* Bên phải: Chỗ để thêm hình ảnh */}
      <div className="auth-image-side">
        Thêm 1 hình ảnh ở đây
      </div>
    </div>
  );
};

export default Login;