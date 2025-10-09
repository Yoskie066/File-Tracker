import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../../models/AdminModel/AdminModel.js";

const generateAdminId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// REGISTER ADMIN
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
      tempPlainPassword: password,
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

// LOGIN ADMIN
export const loginAdmin = async (req, res) => {
  try {
    const { adminNumber, password } = req.body;

    let admin = await Admin.findOne({ adminNumber }); 
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    let isPasswordValid = false;

    if (admin.password.startsWith("$2b$") || admin.password.startsWith("$2a$")) {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    } else {
      if (admin.password === password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
        await admin.save();
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ALTERNATIVE: Mas reliable na paraan - set all admins individually
    const allAdmins = await Admin.find({});
    for (let adm of allAdmins) {
      adm.status = adm.adminId === admin.adminId ? "online" : "offline";
      await adm.save();
    }
    
    // Re-fetch ang current admin para sa updated data
    admin = await Admin.findOne({ adminNumber }); // DITO GAGAMITIN ANG LET

    const token = jwt.sign(
      {
        adminId: admin.adminId,
        adminName: admin.adminName,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
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
    console.error("Admin Login Error:", error);
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};
