import express from "express";
import { registerFaculty, loginFaculty } from "../../controllers/FacultyController/FacultyController.js";
import { logoutFaculty } from "../../controllers/FacultyController/FacultyLogoutController.js"
import { verifyToken } from "../../middleware/verifyToken.js";
import { createFacultyLoaded, getFacultyLoadeds, getFacultyLoadedById, updateFacultyLoaded, deleteFacultyLoaded } from "../../controllers/FacultyController/FacultyLoadedController.js";
import { createTaskDeliverables, getTaskDeliverables, getTaskDeliverablesById, updateTaskDeliverables, deleteTaskDeliverables, getFacultyLoadedsForTaskDeliverables } from "../../controllers/FacultyController/TaskDeliverablesController.js";
import { createNotification, getNotificationsByRecipient, getUnreadCount, markAsRead, markAllAsRead } from "../../controllers/FacultyController/NotificationController.js";

const router = express.Router();

router.post("/register", registerFaculty);
router.post("/login", loginFaculty);
router.post("/logout", logoutFaculty);

// Protected routes
router.get("/faculty-profile", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to your profile",
    admin: req.admin,
  });
});

// Faculty Loaded Routes
router.post("/faculty-loaded", createFacultyLoaded);
router.get("/faculty-loaded", getFacultyLoadeds);
router.get("/faculty-loaded/:id", getFacultyLoadedById);
router.put("/faculty-loaded/:id", updateFacultyLoaded);
router.delete("/faculty-loaded/:id", deleteFacultyLoaded);

// Task Deliverables Routes
router.post("/task-deliverables", createTaskDeliverables);
router.get("/task-deliverables", getTaskDeliverables);
router.get("/task-deliverables/faculty-loaded", getFacultyLoadedsForTaskDeliverables); 
router.get("/task-deliverables/:id", getTaskDeliverablesById); 
router.put("/task-deliverables/:id", updateTaskDeliverables); 
router.delete("/task-deliverables/:id", deleteTaskDeliverables);

// Notification Routes
router.post("/notifications", createNotification);
router.get("/notifications/:recipient_id", getNotificationsByRecipient);
router.get("/notifications/:recipient_id/unread-count", getUnreadCount);
router.put("/notifications/:id/read", markAsRead);
router.put("/notifications/:recipient_id/read-all", markAllAsRead);


export default router;