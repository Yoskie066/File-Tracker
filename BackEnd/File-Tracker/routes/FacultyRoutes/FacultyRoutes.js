import express from "express";
import { registerFaculty, loginFaculty, forgotPasswordFaculty, refreshTokenFaculty } from "../../controllers/FacultyController/FacultyController.js";
import { logoutFaculty } from "../../controllers/FacultyController/FacultyLogoutController.js"
import { verifyToken } from "../../middleware/verifyToken.js";
import { createFacultyLoaded, getFacultyLoadeds, getFacultyLoadedById, updateFacultyLoaded, deleteFacultyLoaded } from "../../controllers/FacultyController/FacultyLoadedController.js";
import { uploadFile, upload, getFacultyFiles } from "../../controllers/FacultyController/FileUploadController.js"; 
import { getFacultyFileHistory } from "../../controllers/FacultyController/FileHistoryController.js";
import { getTaskDeliverables, getTaskDeliverablesById, updateTaskDeliverables } from "../../controllers/FacultyController/TaskDeliverablesController.js";
import { createNotification, getNotificationsByRecipient, getUnreadCount, markAsRead, markAllAsRead, getFacultyNotifications, getFacultyUnreadCount } from "../../controllers/FacultyController/NotificationController.js";

const router = express.Router();

router.post("/register", registerFaculty);
router.post("/login", loginFaculty);
router.post("/refresh-token", refreshTokenFaculty);
router.put("/forgot-password", forgotPasswordFaculty);
router.post("/logout", verifyToken, logoutFaculty);


// Faculty Loaded Routes
router.post("/faculty-loaded", verifyToken, createFacultyLoaded);
router.get("/faculty-loaded", verifyToken, getFacultyLoadeds);
router.get("/faculty-loaded/:id", verifyToken, getFacultyLoadedById);
router.put("/faculty-loaded/:id", verifyToken, updateFacultyLoaded);
router.delete("/faculty-loaded/:id", verifyToken, deleteFacultyLoaded);


// File upload routes
router.post("/file-upload", verifyToken, upload.single('file'), uploadFile);
router.get("/file-upload/my-files", verifyToken, getFacultyFiles);


// File History Routes 
router.get("/file-history", verifyToken, getFacultyFileHistory);

// Task Deliverables Routes
router.get("/task-deliverables", verifyToken, getTaskDeliverables);
router.get("/task-deliverables/:id", verifyToken, getTaskDeliverablesById);
router.put("/task-deliverables/:id", verifyToken, updateTaskDeliverables);

// Notification Routes
router.post("/notifications", createNotification);
router.get("/notifications/:recipient_id", getNotificationsByRecipient);
router.get("/notifications/:recipient_id/unread-count", getUnreadCount);
router.put("/notifications/:id/read", markAsRead);
router.put("/notifications/:recipient_id/read-all", markAllAsRead);

router.get("/faculty-notifications/:facultyId", getFacultyNotifications);
router.get("/faculty-notifications/:facultyId/unread-count", getFacultyUnreadCount);


export default router;