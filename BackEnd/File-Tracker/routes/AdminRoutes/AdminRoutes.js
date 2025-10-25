import express from "express";
import { registerAdmin, loginAdmin } from "../../controllers/AdminController/AdminController.js";
import { logoutAdmin } from "../../controllers/AdminController/AdminControllerLogout.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { getAllUsers } from "../../controllers/AdminController/UserManagementController.js";
import { getFiles, getFileById, downloadFile, deleteFile, updateFileStatus } from "../../controllers/FacultyController/FileUploadController.js";
import { syncAdminDeliverables, getAdminDeliverables, getDeliverableById, deleteDeliverable, getDeliverablesStats } from "../../controllers/AdminController/AdminDeliverablesController.js";
import { createRequirement, getRequirements, getRequirementById, updateRequirement,  deleteRequirement } from "../../controllers/AdminController/RequirementController.js";
import { getAnalyticsData, getAnalyticsTrends, getFacultyPerformance, storeAnalyticsSnapshot } from "../../controllers/AdminController/AnalyticsController.js";

const router = express.Router();

router.post("/admin-register", registerAdmin);
router.post("/admin-login", loginAdmin);
router.post("/admin-logout", logoutAdmin);

// Protected routes
router.get("/admin-profile", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to your profile",
    admin: req.admin,
  });
});

// User Management Routes
router.get("/user-management", getAllUsers);

// File Management Routes 
router.get("/file-management", getFiles);
router.get("/file-management/:id", getFileById);
router.get("/file-management/:id/download", downloadFile);
router.delete("/file-management/:id", deleteFile);
router.put("/file-management/:id/status", updateFileStatus);

// Admin Deliverables Routes
router.post("/deliverables/sync", syncAdminDeliverables);
router.get("/deliverables", getAdminDeliverables);
router.get("/deliverables/stats", getDeliverablesStats);
router.get("/deliverables/:id", getDeliverableById);
router.delete("/deliverables/:id", deleteDeliverable);

// Requirement Routes
router.get("/requirement", getRequirements);
router.post("/requirement", createRequirement);
router.get("/requirement/:id", getRequirementById);
router.put("/requirement/:id", updateRequirement);
router.delete("/requirement/:id", deleteRequirement);

// Analytics Routes 
router.get("/analytics", getAnalyticsData);
router.get("/analytics/trends", getAnalyticsTrends);
router.get("/analytics/faculty-performance", getFacultyPerformance);
router.post("/analytics/snapshot", storeAnalyticsSnapshot);

export default router;