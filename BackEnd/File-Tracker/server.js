import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import facultyRoutes from "./routes/FacultyRoutes/FacultyRoutes.js";
import adminRoutes from "./routes/AdminRoutes/AdminRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

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
});