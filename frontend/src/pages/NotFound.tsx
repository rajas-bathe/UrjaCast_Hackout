import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <p className="text-lg text-slate-600 mb-8">This page doesn't exist in UrjaCast.</p>
      <Link to="/dashboard">
        <Button variant="primary">Back to Dashboard</Button>
      </Link>
    </div>
  );
}