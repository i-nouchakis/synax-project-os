import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Layout } from '@/components/layout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { InstallPrompt } from '@/components/pwa';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { ProjectsPage } from '@/pages/projects/ProjectsPage';
import { ProjectDetailPage } from '@/pages/projects/ProjectDetailPage';
import { FloorsPage } from '@/pages/floors/FloorsPage';
import { FloorDetailPage } from '@/pages/floors/FloorDetailPage';
import { BuildingDetailPage, BuildingsPage } from '@/pages/buildings';
import { RoomDetailPage } from '@/pages/rooms/RoomDetailPage';
import { AssetsPage } from '@/pages/assets/AssetsPage';
import { AssetDetailPage } from '@/pages/assets/AssetDetailPage';
import { ChecklistsPage } from '@/pages/checklists';
import { IssuesPage } from '@/pages/issues';
import { InventoryPage } from '@/pages/inventory';
import { ReportsPage } from '@/pages/reports';
import { SettingsPage } from '@/pages/settings';
import { ManualPage } from '@/pages/manual';
import { LabelsPage } from '@/pages/labels';
import { TimeTrackingPage } from '@/pages/time-tracking';
import { LookupsPage } from '@/pages/lookups';
import { ChecklistTemplatesPage } from '@/pages/checklist-templates';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { useOfflineStore } from '@/stores/offline.store';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});


// Auth initializer component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}

// PWA Update Prompt
function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('SW registered:', registration);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-surface border border-surface-border rounded-lg shadow-lg p-4 max-w-sm">
      <p className="text-body text-text-primary mb-3">
        A new version is available!
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 bg-primary text-white rounded-md text-body-sm hover:bg-primary/90"
        >
          Update now
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="px-3 py-1.5 bg-surface-secondary text-text-secondary rounded-md text-body-sm hover:bg-surface-hover"
        >
          Later
        </button>
      </div>
    </div>
  );
}

// Initialize offline store on app load
function OfflineInitializer({ children }: { children: React.ReactNode }) {
  const { updateDatabaseStats } = useOfflineStore();

  useEffect(() => {
    updateDatabaseStats();
  }, [updateDatabaseStats]);

  return <>{children}</>;
}

// Theme-aware Toaster component
function ThemedToaster() {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  return (
    <Toaster
      position="top-right"
      theme={resolvedTheme}
      toastOptions={{
        style: {
          background: resolvedTheme === 'dark' ? '#161b22' : '#ffffff',
          color: resolvedTheme === 'dark' ? '#f1f5f9' : '#0f172a',
          border: resolvedTheme === 'dark' ? '1px solid #30363d' : '1px solid #cbd5e1',
        },
      }}
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <OfflineInitializer>
          <BrowserRouter>
            <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lookups"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LookupsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checklist-templates"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'PM']}>
                    <ChecklistTemplatesPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/buildings" element={<BuildingsPage />} />
              <Route path="/buildings/:id" element={<BuildingDetailPage />} />
              <Route path="/floors" element={<FloorsPage />} />
              <Route path="/floors/:id" element={<FloorDetailPage />} />
              <Route path="/rooms/:id" element={<RoomDetailPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/checklists" element={<ChecklistsPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/manual" element={<ManualPage />} />
              <Route path="/labels" element={<LabelsPage />} />
              <Route path="/time-tracking" element={<TimeTrackingPage />} />
            </Route>

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-background flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-display text-text-primary">404</h1>
                    <p className="text-body text-text-secondary mt-2">Page not found</p>
                  </div>
                </div>
              }
            />
            </Routes>
          </BrowserRouter>
        </OfflineInitializer>
      </AuthInitializer>

      {/* Toast notifications */}
      <ThemedToaster />

      {/* PWA components */}
      <InstallPrompt />
      <PWAUpdatePrompt />
    </QueryClientProvider>
  );
}

export default App;
