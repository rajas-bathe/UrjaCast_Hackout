import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import MapView from '@/pages/MapView';
import Forecast from '@/pages/Forecast';
import DecisionPanel from '@/pages/DecisionPanel';
import Reports from '@/pages/Reports';
import AssetConfig from '@/pages/AssetConfig';
import TechnicalOverview from '@/pages/TechnicalOverview';
import NotFound from '@/pages/NotFound';
import { useAuthStore } from '@/store/useAuthStore';

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/technical-overview" element={<TechnicalOverview />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/map" element={<Protected><MapView /></Protected>} />
      <Route path="/forecast" element={<Protected><Forecast /></Protected>} />
      <Route path="/decision" element={<Protected><DecisionPanel /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/asset-config" element={<Protected><AssetConfig /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}