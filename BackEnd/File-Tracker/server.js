import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import facultyRoutes from "./routes/FacultyRoutes/FacultyRoutes.js";
import adminRoutes from "./routes/AdminRoutes/AdminRoutes.js";
import path from "path";
import fs from "fs";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory - FIXED PATH
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Base route
app.get("/", (req, res) => {
  res.send("Hello, API Server is running");
});

// Faculty routes
app.use("/api/faculty", facultyRoutes); 
// Admin routes
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${path.join(process.cwd(), 'uploads')}`);
});