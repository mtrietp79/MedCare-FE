import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken, USER_KEY } from '../services/auth';

interface Props {
  allowedRoles: string[];
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const token = getStoredToken();
  const storedUser = localStorage.getItem(USER_KEY)
  const userRole = storedUser ? (JSON.parse(storedUser).role as string) : null

  if (!token) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(userRole || '')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};