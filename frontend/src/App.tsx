import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { BinsPage } from './pages/BinsPage';
import { TicketsPage } from './pages/TicketsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { RoutesPage } from './pages/RoutesPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PickupsPage } from './pages/PickupsPage';
import { UsersPage } from './pages/UsersPage';
import { MapPage } from './pages/MapPage';
import { BinRequestsPage } from './pages/BinRequestsPage';
import { DeliveriesPage } from './pages/DeliveriesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pickups"
              element={
                <ProtectedRoute allowedRoles={['resident']}>
                  <PickupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bins"
              element={
                <ProtectedRoute>
                  <BinsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <TicketsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/routes"
              element={
                <ProtectedRoute allowedRoles={['collector', 'authority', 'operator', 'admin']}>
                  <RoutesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute allowedRoles={['collector']}>
                  <MapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <ProtectedRoute allowedRoles={['collector', 'authority', 'admin']}>
                  <CollectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['authority', 'admin']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['operator', 'admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bin-requests"
              element={
                <ProtectedRoute>
                  <BinRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deliveries"
              element={
                <ProtectedRoute>
                  <DeliveriesPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
