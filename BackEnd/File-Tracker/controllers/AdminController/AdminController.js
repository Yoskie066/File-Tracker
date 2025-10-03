import Admin from "../../models/AdminModel/AdminModel.js";

const generateAdminId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Register Admin
export const registerAdmin = async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body); 
    
    const { adminName, adminNumber, password } = req.body;

    const existingAdmin = await Admin.findOne({ adminNumber });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already registered" });
    }

    const adminId = generateAdminId();

    const newAdmin = new Admin({
      adminId,
      adminName,
      adminNumber,
      password, 
      role: "admin",
      status: "offline",
      registeredAt: new Date(),
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      newAdmin,
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

    if (admin.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    admin.status = "online";
    await admin.save();

    res.json({ message: "Login successful", admin });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};
