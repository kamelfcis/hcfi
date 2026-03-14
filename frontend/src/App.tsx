import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CorrespondenceList from '@/pages/CorrespondenceList';
import CreateCorrespondence from '@/pages/CreateCorrespondence';
import EditCorrespondence from '@/pages/EditCorrespondence';
import CorrespondenceDetails from '@/pages/CorrespondenceDetails';
import Reviews from '@/pages/Reviews';
import Entities from '@/pages/Entities';
import Users from '@/pages/Users';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import AuditLogs from '@/pages/AuditLogs';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, loadFromStorage, user } = useAuthStore();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      // First load from storage
      loadFromStorage();
      
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Verify session is still valid
          await api.get('/auth/me');
          setVerifying(false);
        } catch (error) {
          // Session invalid, clear it and redirect
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setVerifying(false);
        }
      } else {
        setVerifying(false);
      }
    };
    
    verifySession();
  }, [loadFromStorage]);

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { i18n } = useTranslation();
  const { loadFromStorage, accessToken } = useAuthStore();

  // Load session from localStorage on app initialization
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const lang = localStorage.getItem('i18nextLng') || 'ar';
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [i18n]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/correspondences"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CorrespondenceList />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/incoming"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CorrespondenceList />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/outgoing"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CorrespondenceList defaultType="outgoing" />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CreateCorrespondence />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/correspondences/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CorrespondenceDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/correspondences/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EditCorrespondence />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reviews />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/entities"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Entities />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Users />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AuditLogs />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer
        position={i18n.language === 'ar' ? 'top-left' : 'top-right'}
        rtl={i18n.language === 'ar'}
      />
    </BrowserRouter>
  );
}

export default App;

