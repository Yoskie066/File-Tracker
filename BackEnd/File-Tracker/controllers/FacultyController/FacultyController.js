import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

const generateFacultyId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Generate tokens function
const generateTokens = (faculty) => {
  const accessToken = jwt.sign(
    {
      facultyId: faculty.facultyId,
      facultyName: faculty.facultyName,
      role: faculty.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } 
  );

  const refreshToken = jwt.sign(
    {
      facultyId: faculty.facultyId,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } 
  );

  return { accessToken, refreshToken };
};

// REGISTER FACULTY
export const registerFaculty = async (req, res) => {
  try {
    const { facultyName, facultyNumber, password } = req.body;

    const existingFaculty = await Faculty.findOne({ facultyNumber });
    if (existingFaculty) {
      return res.status(400).json({ message: "Faculty already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const facultyId = generateFacultyId();

    const newFaculty = new Faculty({
      facultyId,
      facultyName,
      facultyNumber,
      password: hashedPassword,
      role: "faculty",
      status: "offline",
      registeredAt: new Date(),
    });

    await newFaculty.save();

    res.status(201).json({
      message: "Faculty registered successfully",
      facultyId: newFaculty.facultyId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering faculty",
      error: error.message,
    });
  }
};

// LOGIN FACULTY 
export const loginFaculty = async (req, res) => {
  try {
    const { facultyNumber, password } = req.body;

    let faculty = await Faculty.findOne({ facultyNumber });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    let isPasswordValid = false;

    // Check if password is hashed
    if (faculty.password.startsWith("$2b$") || faculty.password.startsWith("$2a$")) {
      isPasswordValid = await bcrypt.compare(password, faculty.password);
    } else {
      // Convert plain password to hash if still plain text
      if (faculty.password === password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        faculty.password = hashedPassword;
        await faculty.save();
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update only the current faculty status to online 
    faculty = await Faculty.findOneAndUpdate(
      { facultyNumber },
      { status: "online" },
      { new: true }
    );

    // Generate both tokens
    const { accessToken, refreshToken } = generateTokens(faculty);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      faculty: {
        facultyId: faculty.facultyId,
        facultyName: faculty.facultyName,
        facultyNumber: faculty.facultyNumber,
        role: faculty.role,
        status: faculty.status, 
      },
    });
  } catch (error) {
    console.error("Faculty Login Error:", error);
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};

// REFRESH TOKEN ENDPOINT FOR FACULTY
export const refreshTokenFaculty = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const faculty = await Faculty.findOne({ facultyId: decoded.facultyId });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(faculty);

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

// Forgot Password Faculty
export const forgotPasswordFaculty = async (req, res) => {
  try {
    const { facultyNumber, facultyName, newPassword } = req.body;

    const faculty = await Faculty.findOne({ 
      facultyNumber, 
      facultyName: { $regex: new RegExp(`^${facultyName}$`, 'i') } 
    });

    if (!faculty) {
      return res.status(404).json({ 
        message: "Faculty not found. Please check your Faculty Number and Name." 
      });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ 
        message: "Password must be at least 4 characters long" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    faculty.password = hashedPassword;
    await faculty.save();

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