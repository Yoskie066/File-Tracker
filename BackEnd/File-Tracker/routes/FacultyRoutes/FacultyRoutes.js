import express from "express";
import { registerFaculty, loginFaculty } from "../../controllers/FacultyController/FacultyController.js";
import { verifyToken } from "../../middleware/verifyToken.js";

const router = express.Router();

router.post("/register", registerFaculty);
router.post("/login", loginFaculty);

// Protected routes
router.get("/faculty-profile", verifyToken, (req, res) => {
  res.json({
    message: "Welcome to your profile",
    admin: req.admin,
  });
});

export default router;