import express from "express";
import { registerAdmin, loginAdmin, forgotPasswordAdmin, refreshTokenAdmin } from "../../controllers/AdminController/AdminController.js";
import { logoutAdmin } from "../../controllers/AdminController/AdminControllerLogout.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { getAllUsers, deleteAdmin, deleteFaculty } from "../../controllers/AdminController/UserManagementController.js";
import { getFiles, getFileById, downloadFile, deleteFile, updateFileStatus, bulkCompleteAllFiles } from "../../controllers/FacultyController/FileUploadController.js";
import { getAdminNotices, createAdminNotice, getAdminNoticeById, updateAdminNotice, deleteAdminNotice } from "../../controllers/AdminController/AdminNoticeController.js";
import { getAnalyticsData, getFacultyPerformance } from "../../controllers/AdminController/AnalyticsController.js";
import { getSystemVariables, getVariablesByCategory, createSystemVariable, updateSystemVariable, deleteSystemVariable, getVariableStats, getSystemVariableById } from "../../controllers/AdminController/SystemVariableController.js";

const router = express.Router();

router.post("/admin-register", registerAdmin);
router.post("/admin-login", loginAdmin);
router.post("/admin-refresh-token", refreshTokenAdmin);
router.put("/admin-forgot-password", forgotPasswordAdmin);
router.post("/admin-logout", verifyToken, logoutAdmin);

// User Management Routes
router.get("/user-management", getAllUsers);
router.delete("/delete-admin/:adminId", deleteAdmin);
router.delete("/delete-faculty/:facultyId", deleteFaculty);

// File Management Routes 
router.get("/file-management", getFiles);
router.get("/file-management/:id", getFileById);
router.get("/file-management/:id/download", downloadFile);
router.delete("/file-management/:id", deleteFile);
router.put("/file-management/:id/status", updateFileStatus);
router.put("/file-management/bulk-complete", bulkCompleteAllFiles);

// Admin Notice Routes
router.get("/admin-notice", getAdminNotices);
router.post("/admin-notice", createAdminNotice);
router.get("/admin-notice/:id", getAdminNoticeById);
router.put("/admin-notice/:id", updateAdminNotice);
router.delete("/admin-notice/:id", deleteAdminNotice);

// Analytics Routes 
router.get("/analytics", getAnalyticsData);
router.get("/analytics/faculty-performance", getFacultyPerformance);

// System Variable Routes
router.get("/system-variables", getSystemVariables);
router.get("/system-variables/stats", getVariableStats);
router.get("/system-variables/:id", getSystemVariableById); 
router.get("/system-variables/category/:category", getVariablesByCategory);
router.post("/system-variables", createSystemVariable);
router.put("/system-variables/:id", updateSystemVariable);
router.delete("/system-variables/:id", deleteSystemVariable);

export default router;