import express from "express";
import { registerAdmin, loginAdmin } from "../../controllers/AdminController/AdminController.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = express.Router();

router.post("/admin-register", registerAdmin);
router.post("/admin-login", loginAdmin);

// Protected routes
router.get("/admin-profile", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to your profile",
    admin: req.admin,
  });
});

export default router;