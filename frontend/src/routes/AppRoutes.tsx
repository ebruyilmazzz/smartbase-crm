import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { AppLayout } from '../components/layout/AppLayout.js';
import { Login } from '../pages/Login.js';
import { Dashboard } from '../pages/Dashboard.js';
import { CompanyList } from '../pages/companies/CompanyList.js';
import { CompanyDetail } from '../pages/companies/CompanyDetail.js';
import { TaskList } from '../pages/tasks/TaskList.js';
import { TaskDetail } from '../pages/tasks/TaskDetail.js';
import { RequestList } from '../pages/requests/RequestList.js';
import { RequestDetail } from '../pages/requests/RequestDetail.js';
import { ActivityList } from '../pages/activities/ActivityList.js';
import { ReportsPage } from '../pages/reports/ReportsPage.js';
import { SettingsPage } from '../pages/settings/SettingsPage.js';
import { LoadingState } from '../components/common/LoadingState.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'ADMIN' }> = ({
  children,
  requiredRole,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <LoadingState message="Oturum doğrulanıyor..." className="text-white" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Companies */}
        <Route path="companies" element={<CompanyList />} />
        <Route path="companies/:id" element={<CompanyDetail />} />

        {/* Tasks */}
        <Route path="tasks" element={<TaskList />} />
        <Route path="tasks/:id" element={<TaskDetail />} />

        {/* Requests */}
        <Route path="requests" element={<RequestList />} />
        <Route path="requests/:id" element={<RequestDetail />} />

        {/* Activities */}
        <Route path="activities" element={<ActivityList />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Settings (Admin Only) */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
