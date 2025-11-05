import { Routes, Route, Navigate } from 'react-router-dom';
import AuthRoutes from './AuthRoutes/AuthRoutes';
import FacultyRoutes from './FacultyRoutes/FacultyRoutes';
import AdminRoutes from './AdminRoutes/AdminRoutes';
import NotFound from '../components/Common/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth/*" element={<AuthRoutes />} />
      
      {/* Faculty Routes */}
      <Route path="/faculty/*" element={<FacultyRoutes />} />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/admin-login" element={<Navigate to="/auth/admin-login" replace />} />
      
      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;