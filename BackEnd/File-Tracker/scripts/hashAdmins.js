import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/AdminModel/AdminModel.js";

const MONGO_URI = "mongodb://localhost:27017/filetracker"; 

async function migratePasswords() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB...");

    const admins = await Admin.find();
    for (let admin of admins) {
      if (!admin.password.startsWith("$2b$") && !admin.password.startsWith("$2a$")) {
        console.log(`Hashing password for: ${admin.adminName}`);
        admin.password = await bcrypt.hash(admin.password, 10);
        await admin.save();
      }
    }

    console.log("Migration done! All plain text passwords are now hashed.");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migratePasswords();