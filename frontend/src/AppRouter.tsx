import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminShell from './App';
import Login from './pages/Login';
import EmployeeShell from './layouts/EmployeeShell';
import { useAuth } from './context/AuthContext';

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
        element={user ? <Navigate to={user.role === 'admin' ? '/crm' : '/crm/vendas'} replace /> : <Login />}
      />
      <Route
        path="*"
        element={
          user ? (
            user.role === 'admin' ? (
              <AdminShell />
            ) : (
              <EmployeeShell />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
