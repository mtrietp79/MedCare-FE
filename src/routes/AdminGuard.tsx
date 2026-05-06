import { Navigate } from 'react-router-dom';

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  // Lấy role từ localStorage mà bạn đã lưu khi login thành công
  const userRole = localStorage.getItem('user_role'); 

  if (userRole !== 'ROLE_ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};