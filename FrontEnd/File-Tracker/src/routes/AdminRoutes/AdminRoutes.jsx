import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/AdminLayout/Layout';
import Analytics from '../../pages/Admin/Analytics';
import UserManagement from '../../pages/Admin/UserManagement';
import FileManagement from '../../pages/Admin/FileManagement';
import AdminDeliverables from '../../pages/Admin/AdminDeliverables';
import Requirement from '../../pages/Admin/Requirement';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/file-management" element={<FileManagement />} />
        <Route path="/deliverables" element={<AdminDeliverables />} />
        <Route path="/requirement" element={<Requirement />} />
        <Route path="/" element={<Analytics />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;