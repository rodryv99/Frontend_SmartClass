import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles específicos y el usuario no tiene ninguno de ellos
  if (allowedRoles && !allowedRoles.includes(currentUser.user_type)) {
    // Redirigir según el tipo de usuario
    if (currentUser.user_type === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (currentUser.user_type === 'teacher') {
      return <Navigate to="/teacher" replace />;
    } else if (currentUser.user_type === 'student') {
      return <Navigate to="/student" replace />;
    }
    // Por defecto redirigir al inicio
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;