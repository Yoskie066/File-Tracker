import express from "express";
import { registerFaculty, loginFaculty } from "../../controllers/FacultyController/FacultyController.js";
import { logoutFaculty } from "../../controllers/FacultyController/FacultyLogoutController.js"
import { verifyToken } from "../../middleware/verifyToken.js";
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

// Notification Routes
router.post("/notifications", createNotification);
router.get("/notifications/:recipient_id", getNotificationsByRecipient);
router.get("/notifications/:recipient_name/unread-count", getUnreadCount);
router.put("/notifications/:id/read", markAsRead);
router.put("/notifications/:recipient_name/read-all", markAllAsRead);


export default router;