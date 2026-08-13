import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminShell from './App';
import { useAuth } from './context/useAuth';
import Login from './pages/Login';
import EmployeeShell from './layouts/EmployeeShell';
import { getDefaultRouteForRole } from './services/authApi';

export default function AppRouter() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f141a] text-white flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return (
    <Routes location={location}>
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRouteForRole(user.role)} replace /> : <Login />}
      />
      <Route
        path="*"
        element={
          user ? (
            user.role === 'employee' ? (
              <EmployeeShell />
            ) : (
              <AdminShell />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
