// /frontend/src/components/ProtectedRoute.tsx

import { useAuth } from '@/hooks/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';


const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // While checking for user, show a loading state
  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // If user is logged in, render the child route. Otherwise, redirect to login.
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;