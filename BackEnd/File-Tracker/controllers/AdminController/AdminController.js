import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../../models/AdminModel/AdminModel.js";

const generateAdminId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Register Admin
export const registerAdmin = async (req, res) => {
  try {
    const { adminName, adminNumber, password } = req.body;

    const existingAdmin = await Admin.findOne({ adminNumber });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 
    const adminId = generateAdminId();

    const newAdmin = new Admin({
      adminId,
      adminName,
      adminNumber,
      password: hashedPassword,
      role: "admin",
      status: "offline",
      registeredAt: new Date(),
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      adminId: newAdmin.adminId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering admin",
      error: error.message,
    });
  }
};

// Login Admin
export const loginAdmin = async (req, res) => {
  try {
    const { adminNumber, password } = req.body;

    const admin = await Admin.findOne({ adminNumber });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    console.log("LOGIN REQUEST BODY:", req.body);
    console.log("FOUND ADMIN:", admin.adminNumber, admin.adminName);
    console.log("DB Password:", admin.password);
    console.log("Input Password:", password);

    let isPasswordValid = false;

    // check if bcrypt na
    if (admin.password.startsWith("$2b$") || admin.password.startsWith("$2a$")) {
      console.log("Password type: bcrypt hash");
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      console.log("Password type: plain text");
      if (admin.password === password) {
        console.log("Plain text matched, hashing now...");
        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
        await admin.save();
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      console.log("Invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    admin.status = "online";
    await admin.save();

    // Generate JWT
    const token = jwt.sign(
      {
        adminId: admin.adminId,
        adminName: admin.adminName,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminNumber: admin.adminNumber,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};

