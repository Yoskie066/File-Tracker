import express from "express";
import { 
  loginAdmin, 
  forgotPasswordAdmin, 
  refreshTokenAdmin,
  getSecurityQuestions,
  getAdminSecurityQuestion
} from "../../controllers/AdminController/AdminController.js";
import { logoutAdmin } from "../../controllers/AdminController/AdminControllerLogout.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { 
  getAllUsers, 
  registerUser, 
  getUserById, 
  updateUser, 
  deleteAdmin, 
  deleteFaculty 
} from "../../controllers/AdminController/UserManagementController.js";
import { 
  getFiles, 
  getFileById, 
  deleteFile, 
  updateFileStatus, 
  bulkCompleteAllFiles,
  downloadFile
} from "../../controllers/FacultyController/FileUploadController.js";
import { getArchivedFiles, getArchiveStatistics } from "../../controllers/AdminController/AdminArchiveController.js";
import { getAdminNotices, getAllFaculty, getAdminNoticeStats, createAdminNotice, getAdminNoticeById, updateAdminNotice, deleteAdminNotice } from "../../controllers/AdminController/AdminNoticeController.js";
import { getAnalyticsData, getFacultyPerformance, getAvailableYears } from "../../controllers/AdminController/AnalyticsController.js";
import {
  createSystemVariable,
  getSystemVariables,
  getSystemVariableById,
  getAllSubjects,
  updateSystemVariable,
  deleteSystemVariable,
  getVariableStats,
  getVariablesForFacultyLoad,
  getSubjectCodes,
  getSubjectTitles
} from "../../controllers/AdminController/SystemVariableController.js";
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationAsRead
} from "../../controllers/AdminController/AdminNotificationController.js";

const router = express.Router();

// Security Questions Routes
router.get("/security-questions", getSecurityQuestions);
router.get("/security-question", getAdminSecurityQuestion);

// Authentication Routes 
router.post("/admin-login", loginAdmin);
router.post("/admin-refresh-token", refreshTokenAdmin);
router.put("/admin-forgot-password", forgotPasswordAdmin);
router.post("/admin-logout", verifyToken, logoutAdmin);

// User Management Routes
router.get("/user-management", getAllUsers);
router.post("/user-management/register", registerUser);
router.get("/user-management/:id", getUserById);
router.put("/user-management/:id", updateUser);
router.delete("/delete-admin/:adminId", deleteAdmin);
router.delete("/delete-faculty/:facultyId", deleteFaculty);

// File Management Routes 
router.get("/file-management", getFiles);
router.get("/file-management/:id", getFileById);
router.delete("/file-management/:id", deleteFile);
router.put("/file-management/:id/status", updateFileStatus);
router.put("/file-management/bulk-complete", bulkCompleteAllFiles);
router.get("/file-management/download/:id", downloadFile);

// Archive Management Routes
router.get("/archive", getArchivedFiles);
router.get("/archive/statistics", getArchiveStatistics);

// Admin Notice Routes
router.get("/admin-notice", getAdminNotices);
router.get("/admin-notice/faculty", getAllFaculty);
router.get("/admin-notice/stats", getAdminNoticeStats);
router.post("/admin-notice", createAdminNotice);
router.get("/admin-notice/:id", getAdminNoticeById);
router.put("/admin-notice/:id", updateAdminNotice);
router.delete("/admin-notice/:id", deleteAdminNotice);

// Analytics Routes 
router.get("/analytics", getAnalyticsData);
router.get("/analytics/faculty-performance", getFacultyPerformance);
router.get("/analytics/available-years", getAvailableYears);

// System Variable Routes
router.post('/system-variables', createSystemVariable);
router.get('/system-variables', getSystemVariables);
router.get('/system-variables/stats', getVariableStats);
router.get('/system-variables/all-subjects', getAllSubjects);
router.get('/system-variables/subject-codes', getSubjectCodes);
router.get('/system-variables/subject-titles', getSubjectTitles);
router.get('/system-variables/faculty-load', getVariablesForFacultyLoad);
router.get('/system-variables/:id', getSystemVariableById); 
router.put('/system-variables/:id', updateSystemVariable);
router.delete('/system-variables/:id', deleteSystemVariable);

// Admin Notification Routes 
router.get("/admin-notifications", getAdminNotifications);
router.get("/admin-notifications/unread-count", getAdminUnreadCount);
router.put("/admin-notifications/:id/read", markAdminNotificationAsRead);

export default router;