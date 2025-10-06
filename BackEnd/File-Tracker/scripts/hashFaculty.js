import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Faculty from "../models/FacultyModel/FacultyModel.js";

const MONGO_URI = "mongodb://localhost:27017/filetracker"; 

async function migrateFacultyPasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB...");

    const faculties = await Faculty.find();
    for (let faculty of faculties) {
      if (!faculty.password.startsWith("$2b$") && !faculty.password.startsWith("$2a$")) {
        console.log(`Hashing password for: ${faculty.facultyName}`);
        faculty.password = await bcrypt.hash(faculty.password, 10);
        await faculty.save();
      }
    }

    console.log("Migration done! All plain text faculty passwords are now hashed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrateFacultyPasswords();