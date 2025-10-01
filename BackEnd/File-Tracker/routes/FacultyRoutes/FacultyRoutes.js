import express from "express";
import { registerFaculty, loginFaculty } from "../../controllers/FacultyController/FacultyController.js";

const router = express.Router();

router.post("/register", registerFaculty);
router.post("/login", loginFaculty);

export default router;