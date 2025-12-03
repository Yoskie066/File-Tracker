import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from "./config/db.js";
import facultyRoutes from "./routes/FacultyRoutes/FacultyRoutes.js";
import adminRoutes from "./routes/AdminRoutes/AdminRoutes.js";

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Base route
app.get("/", (req, res) => {
  res.send("Hello, API Server is running");
});

// Faculty routes
app.use("/api/faculty", facultyRoutes); 
// Admin routes
app.use("/api/admin", adminRoutes);

// Create uploads directory if it doesn't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`);
  console.log('Uploads directory available at /uploads');
});