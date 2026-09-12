import { useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ToastProvider } from '@/components/ui/Toast';
import { AppRouter } from './router';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

export default function App() {
  const { pathname } = useLocation();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  return (
    <ToastProvider>
      {isPublic ? (
        <AppRouter />
      ) : (
        <AppShell title="UrjaCast">
          <AppRouter />
        </AppShell>
      )}
    </ToastProvider>
  );
}