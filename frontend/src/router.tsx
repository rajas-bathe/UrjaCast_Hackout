import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import MapView from '@/pages/MapView';
import Forecast from '@/pages/Forecast';
import DecisionPanel from '@/pages/DecisionPanel';
import Reports from '@/pages/Reports';
import AssetConfig from '@/pages/AssetConfig';
import HowItWorks from '@/pages/HowItWorks';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import { useAuthStore } from '@/store/useAuthStore';

function Protected({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  const authed = isAuthenticated || !!token;

  if (!authed) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const authed = isAuthenticated || !!token;

  if (authed) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <Signup />
          </PublicOnly>
        }
      />
      <Route path="/how-it-works" element={<HowItWorks />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/map"
        element={
          <Protected>
            <MapView />
          </Protected>
        }
      />
      <Route
        path="/forecast"
        element={
          <Protected>
            <Forecast />
          </Protected>
        }
      />
      <Route
        path="/decision"
        element={
          <Protected>
            <DecisionPanel />
          </Protected>
        }
      />
      <Route
        path="/reports"
        element={
          <Protected>
            <Reports />
          </Protected>
        }
      />
      <Route
        path="/asset-config"
        element={
          <Protected>
            <AssetConfig />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <Profile />
          </Protected>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}