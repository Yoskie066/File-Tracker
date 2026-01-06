import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../../models/AdminModel/AdminModel.js";

const generateAdminId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Generate tokens function for admin
const generateAdminTokens = (admin) => {
  const accessToken = jwt.sign(
    {
      adminId: admin.adminId,
      adminName: admin.adminName,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" } 
  );

  const refreshToken = jwt.sign(
    {
      adminId: admin.adminId,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } 
  );

  return { accessToken, refreshToken };
};

// Security questions array
export const securityQuestions = [
  "What was your first pet's name?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What is your favorite movie?",
  "What is your favorite food?",
  "What is your favorite color?",
  "What is your favorite sport?",
  "What is your favorite teacher's name?",
  "What is your favorite car?"
];

// Get security questions
export const getSecurityQuestions = async (req, res) => {
  try {
    res.status(200).json({
      questions: securityQuestions
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching security questions",
      error: error.message,
    });
  }
};

// Get admin security question
export const getAdminSecurityQuestion = async (req, res) => {
  try {
    const { adminNumber, adminName } = req.query;

    if (!adminNumber || !adminName) {
      return res.status(400).json({ 
        message: "Admin number and name are required" 
      });
    }

    const admin = await Admin.findOne({ 
      adminNumber,
      adminName: { $regex: new RegExp(`^${adminName}$`, 'i') }
    });

    if (!admin) {
      return res.status(404).json({ 
        message: "Admin not found" 
      });
    }

    res.status(200).json({
      securityQuestion: admin.securityQuestion
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching security question",
      error: error.message,
    });
  }
};

// REGISTER ADMIN
export const registerAdmin = async (req, res) => {
  try {
    const { adminName, adminNumber, password, securityQuestion, securityAnswer } = req.body;

    // Validate admin name length
    if (adminName.length < 8) {
      return res.status(400).json({ 
        message: "Admin name must be at least 8 characters long" 
      });
    }

    // Validate admin number format - minimum 2 digits, numbers only
    const adminNumberRegex = /^\d{2,}$/;
    if (!adminNumberRegex.test(adminNumber)) {
      return res.status(400).json({ 
        message: "Admin number must contain only numbers (minimum 2 digits)" 
      });
    }

    // Validate security question
    if (!securityQuestions.includes(securityQuestion)) {
      return res.status(400).json({ 
        message: "Invalid security question" 
      });
    }

    // Validate security answer
    if (!securityAnswer || securityAnswer.trim().length === 0) {
      return res.status(400).json({ 
        message: "Security answer is required" 
      });
    }

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
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
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
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation Error", 
        errors: messages 
      });
    }
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

    // Validate admin number format - minimum 2 digits, numbers only
    const adminNumberRegex = /^\d{2,}$/;
    if (!adminNumberRegex.test(adminNumber)) {
      return res.status(400).json({ 
        message: "Admin number must contain only numbers (minimum 2 digits)" 
      });
    }

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

    // Update only the current admin status to online
    admin = await Admin.findOneAndUpdate(
      { adminNumber },
      { status: "online" },
      { new: true }
    );

    // Generate both tokens
    const { accessToken, refreshToken } = generateAdminTokens(admin);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      admin: {
        adminId: admin.adminId,
        adminName: admin.adminName,
        adminNumber: admin.adminNumber,
        role: admin.role,
        status: admin.status,
        securityQuestion: admin.securityQuestion,
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

// REFRESH TOKEN ENDPOINT FOR ADMIN
export const refreshTokenAdmin = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const admin = await Admin.findOne({ adminId: decoded.adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateAdminTokens(admin);

    res.status(200).json({
      message: "Token refreshed successfully",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    
    console.error("Refresh Token Error:", error);
    res.status(500).json({
      message: "Error refreshing token",
      error: error.message,
    });
  }
};

// Forgot Password ADMIN
export const forgotPasswordAdmin = async (req, res) => {
  try {
    const { adminNumber, adminName, securityQuestion, securityAnswer, newPassword } = req.body;

    // Validate admin name length
    if (adminName.length < 8) {
      return res.status(400).json({ 
        message: "Admin name must be at least 8 characters long" 
      });
    }

    // Validate admin number format - minimum 2 digits, numbers only
    const adminNumberRegex = /^\d{2,}$/;
    if (!adminNumberRegex.test(adminNumber)) {
      return res.status(400).json({ 
        message: "Admin number must contain only numbers (minimum 2 digits)" 
      });
    }

    // Validate security question
    if (!securityQuestions.includes(securityQuestion)) {
      return res.status(400).json({ 
        message: "Invalid security question" 
      });
    }

    // Validate security answer
    if (!securityAnswer || securityAnswer.trim().length === 0) {
      return res.status(400).json({ 
        message: "Security answer is required" 
      });
    }

    const admin = await Admin.findOne({ 
      adminNumber, 
      adminName: { $regex: new RegExp(`^${adminName}$`, 'i') } 
    });

    if (!admin) {
      return res.status(404).json({ 
        message: "Admin not found. Please check your Admin Number and Name." 
      });
    }

    // Check security question
    if (admin.securityQuestion !== securityQuestion) {
      return res.status(400).json({ 
        message: "Security question does not match" 
      });
    }

    // Check security answer (case-insensitive)
    if (admin.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase().trim()) {
      return res.status(400).json({ 
        message: "Security answer is incorrect" 
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ 
        message: "Password must be at least 4 characters long" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};