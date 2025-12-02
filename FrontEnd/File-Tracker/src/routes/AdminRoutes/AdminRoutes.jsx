import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/AdminLayout/Layout';
import Analytics from '../../pages/Admin/Analytics';
import UserManagement from '../../pages/Admin/UserManagement';
import FileManagement from '../../pages/Admin/FileManagement';
import AdminNotice from '../../pages/Admin/AdminNotice';
import SystemVariables from '../../pages/Admin/SystemVariable';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/file-management" element={<FileManagement />} />
        <Route path="/admin-notice" element={<AdminNotice />} />
        <Route path="/system-variables" element={<SystemVariables />} />
        <Route path="/" element={<Analytics />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;