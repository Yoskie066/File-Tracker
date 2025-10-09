import express from "express";
import { registerAdmin, loginAdmin } from "../../controllers/AdminController/AdminController.js";
import { logoutAdmin } from "../../controllers/AdminController/AdminControllerLogout.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { getAllUsers } from "../../controllers/AdminController/UserManagementController.js";

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


export default router;