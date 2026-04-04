// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './features/auth/useAuth';

// ─── Page imports ─────────────────────────────────────────────────────────────
import ECDCMapPage       from './pages/ECDCMapPage';
import LoginPage         from './pages/LoginPage';
import OutreachVisitsPage from './pages/OutreachVisitsPage';
import PractitionersPage  from './pages/PractitionersPage';
import AuditPage         from './pages/AuditPage';
import MonitorPage       from './pages/MonitorPage';

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Renders children when authenticated. Shows a blank loading state while the
// session is being hydrated (avoids a flash-redirect to /login on hard refresh).

function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return null;                             // or a full-page spinner
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — all app routes live inside this wrapper */}
        <Route element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="/map"         element={<ECDCMapPage />} />
          <Route path="/visits"      element={<OutreachVisitsPage />} />
          <Route path="/practitioners" element={<PractitionersPage />} />
          <Route path="/audit"        element={<AuditPage />} />
          <Route path="/kobo-monitor"      element={<MonitorPage />} />

          {/* Future routes go here, e.g.:
          <Route path="/planning"    element={<PlanningPage />} />
          <Route path="/settings"    element={<SettingsPage />} />
          */}
        </Route>

        {/* Fallback — redirect unknown paths to /map */}
        <Route path="*" element={<Navigate to="/map" replace />} />

      </Routes>
    </BrowserRouter>
  );
}