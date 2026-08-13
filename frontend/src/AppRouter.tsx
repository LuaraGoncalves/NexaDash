import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import RouteScreen from './components/RouteScreen';
import { useAuth } from './context/useAuth';
import { getDefaultRouteForRole } from './services/authApi';

const AdminShell = lazy(() => import('./App'));
const Login = lazy(() => import('./pages/Login'));
const EmployeeShell = lazy(() => import('./layouts/EmployeeShell'));
const ManagerShell = lazy(() => import('./layouts/ManagerShell'));
const FinanceShell = lazy(() => import('./layouts/FinanceShell'));

export default function AppRouter() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteScreen />;
  }

  return (
    <Suspense fallback={<RouteScreen />}>
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
              ) : user.role === 'manager' ? (
                <ManagerShell />
              ) : user.role === 'finance' ? (
                <FinanceShell />
              ) : (
                <AdminShell />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}
