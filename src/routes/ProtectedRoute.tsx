import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken } from '../services/auth';

interface Props {
  allowedRoles: string[];
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const token = getStoredToken();
  // Lấy role đã lưu khi login thành công
  const userRole = localStorage.getItem('user_role'); 

  if (!token) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(userRole || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};