import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../LoadingScreen';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // Guardar ruta intentada si no está autenticado
  useEffect(() => {
    if (!loading && !user && location.pathname !== '/login') {
      sessionStorage.setItem(
        'redirectAfterLogin',
        location.pathname + location.search
      );
    }
  }, [loading, user, location]);

  // Mientras carga sesión
  if (loading) {
    return <LoadingScreen />;
  }

  // No autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Sin permisos por rol
  if (
    requiredRoles.length > 0 &&
    !requiredRoles.some((role) => hasRole(role))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Todo OK
  return children;
};

export default ProtectedRoute;
