import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/AdminLayout/Layout';
import Analytics from '../../pages/Admin/Analytics';
import UserManagement from '../../pages/Admin/UserManagement';
import FileManagement from '../../pages/Admin/FileManagement';
import HistoryRecords from '../../pages/Admin/HistoryRecords';
import AdminNotice from '../../pages/Admin/AdminNotice';
import SystemVariables from '../../pages/Admin/SystemVariable';
import Archive from '../../pages/Admin/Archive';
import AdminNotification from '../../pages/Admin/AdminNotification';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/file-management" element={<FileManagement />} />
        <Route path="/history-of-records" element={<HistoryRecords />} />
        <Route path="/admin-notice" element={<AdminNotice />} />
        <Route path="/system-variables" element={<SystemVariables />} />
        <Route path="/admin-notification" element={<AdminNotification />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/" element={<Analytics />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;