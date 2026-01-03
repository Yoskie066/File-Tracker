import express from "express";
import { registerFaculty, loginFaculty, forgotPasswordFaculty, refreshTokenFaculty } from "../../controllers/FacultyController/FacultyController.js";
import { logoutFaculty } from "../../controllers/FacultyController/FacultyLogoutController.js"
import { verifyToken } from "../../middleware/verifyToken.js";
import { 
  createFacultyLoaded, 
  getFacultyLoadeds, 
  getFacultyLoadedById, 
  updateFacultyLoaded, 
  deleteFacultyLoaded,
  getSubjectsForFacultyLoad,
  getFacultyLoadsForFileUpload
} from "../../controllers/FacultyController/FacultyLoadedController.js";
import { uploadFile, upload, getFacultyFiles } from "../../controllers/FacultyController/FileUploadController.js"; 
import { getFacultyFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";
import { getTaskDeliverables, getTaskDeliverablesById, updateTaskDeliverables } from "../../controllers/FacultyController/TaskDeliverablesController.js";
import { 
  createNotification, 
  getNotificationsByRecipient, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  getFacultyNotifications, 
  getFacultyUnreadCount,
  getFileStatusNotifications,
  getNotificationsByFileId
} from "../../controllers/FacultyController/NotificationController.js";

const router = express.Router();

router.post("/register", registerFaculty);
router.post("/login", loginFaculty);
router.post("/refresh-token", refreshTokenFaculty);
router.put("/forgot-password", forgotPasswordFaculty);
router.post("/logout", verifyToken, logoutFaculty);

// Faculty Loaded Routes
router.get("/faculty-loaded/subjects", verifyToken, getSubjectsForFacultyLoad);
router.get("/faculty-loaded/file-upload", verifyToken, getFacultyLoadsForFileUpload);
router.post("/faculty-loaded", verifyToken, createFacultyLoaded);
router.get("/faculty-loaded", verifyToken, getFacultyLoadeds);
router.get("/faculty-loaded/:id", verifyToken, getFacultyLoadedById);
router.put("/faculty-loaded/:id", verifyToken, updateFacultyLoaded);
router.delete("/faculty-loaded/:id", verifyToken, deleteFacultyLoaded);

// File upload routes
router.post("/file-upload", verifyToken, upload.array('files', 10), uploadFile);
router.get("/file-upload/my-files", verifyToken, getFacultyFiles);

// File History Routes 
router.get("/file-history", verifyToken, getFacultyFileHistory);

// Task Deliverables Routes
router.get("/task-deliverables", verifyToken, getTaskDeliverables);
router.get("/task-deliverables/:id", verifyToken, getTaskDeliverablesById);
router.put("/task-deliverables/:id", verifyToken, updateTaskDeliverables);

// Notification Routes
router.post("/notifications", createNotification);
router.get("/notifications/:recipient_id", verifyToken, getNotificationsByRecipient);
router.get("/notifications/:recipient_id/unread-count", verifyToken, getUnreadCount);
router.put("/notifications/:id/read", verifyToken, markAsRead);
router.put("/notifications/:recipient_id/read-all", verifyToken, markAllAsRead);
router.get("/faculty-notifications/:facultyId", verifyToken, getFacultyNotifications);
router.get("/faculty-notifications/:facultyId/unread-count", verifyToken, getFacultyUnreadCount);
router.get("/file-status-notifications/:facultyId", verifyToken, getFileStatusNotifications);
router.get("/notifications-by-file/:file_id", verifyToken, getNotificationsByFileId);

export default router;