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
      firstName: faculty.firstName,
      middleInitial: faculty.middleInitial,
      lastName: faculty.lastName,
      role: faculty.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" } 
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

// Get faculty security question
export const getFacultySecurityQuestion = async (req, res) => {
  try {
    const { facultyNumber } = req.query;

    if (!facultyNumber) {
      return res.status(400).json({ 
        message: "Faculty number is required" 
      });
    }

    const faculty = await Faculty.findOne({ facultyNumber });

    if (!faculty) {
      return res.status(404).json({ 
        message: "Faculty not found" 
      });
    }

    res.status(200).json({
      securityQuestion: faculty.securityQuestion
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching security question",
      error: error.message,
    });
  }
};

// REGISTER FACULTY (Now only from admin panel)
export const registerFaculty = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      middleInitial, 
      facultyNumber, 
      password, 
      securityQuestion, 
      securityAnswer 
    } = req.body;

    // Validate first name (letters only)
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(firstName)) {
      return res.status(400).json({ 
        message: "First name must contain only letters" 
      });
    }

    if (!nameRegex.test(lastName)) {
      return res.status(400).json({ 
        message: "Last name must contain only letters" 
      });
    }

    // Validate middle initial (optional, but if provided must be a single uppercase letter)
    if (middleInitial && middleInitial.trim() !== '') {
      const middleInitialRegex = /^[A-Z]$/;
      if (!middleInitialRegex.test(middleInitial)) {
        return res.status(400).json({ 
          message: "Middle initial must be empty or a single uppercase letter (A-Z)" 
        });
      }
    }

    // Validate faculty number format - minimum 2 digits, numbers only
    const facultyNumberRegex = /^\d{2,}$/;
    if (!facultyNumberRegex.test(facultyNumber)) {
      return res.status(400).json({ 
        message: "Faculty number must contain only numbers (minimum 2 digits)" 
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

    // Check if number exists in any role
    const Admin = mongoose.model("Admin");
    const existingAdmin = await Admin.findOne({ adminNumber: facultyNumber });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: "This number is already registered as an admin" 
      });
    }

    const existingFaculty = await Faculty.findOne({ facultyNumber });
    if (existingFaculty) {
      return res.status(400).json({ message: "Faculty number already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const facultyId = generateFacultyId();

    const newFaculty = new Faculty({
      facultyId,
      firstName,
      lastName,
      middleInitial: middleInitial || '', // Store empty string if not provided
      facultyNumber,
      password: hashedPassword,
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
      role: "faculty",
      status: "offline",
      registeredAt: new Date(),
    });

    await newFaculty.save();

    res.status(201).json({
      message: "Faculty registered successfully",
      facultyId: newFaculty.facultyId,
      fullName: newFaculty.fullName,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation Error", 
        errors: messages 
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Faculty number already exists" 
      });
    }
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

    // Validate faculty number format - minimum 2 digits, numbers only
    const facultyNumberRegex = /^\d{2,}$/;
    if (!facultyNumberRegex.test(facultyNumber)) {
      return res.status(400).json({ 
        message: "Faculty number must contain only numbers (minimum 2 digits)" 
      });
    }

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
        fullName: faculty.fullName,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        middleInitial: faculty.middleInitial,
        facultyNumber: faculty.facultyNumber,
        role: faculty.role,
        status: faculty.status,
        securityQuestion: faculty.securityQuestion,
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
    const { facultyNumber, securityQuestion, securityAnswer, newPassword } = req.body;

    // Validate faculty number format - minimum 2 digits, numbers only
    const facultyNumberRegex = /^\d{2,}$/;
    if (!facultyNumberRegex.test(facultyNumber)) {
      return res.status(400).json({ 
        message: "Faculty number must contain only numbers (minimum 2 digits)" 
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

    const faculty = await Faculty.findOne({ facultyNumber });

    if (!faculty) {
      return res.status(404).json({ 
        message: "Faculty not found. Please check your Faculty Number." 
      });
    }

    // Check security question
    if (faculty.securityQuestion !== securityQuestion) {
      return res.status(400).json({ 
        message: "Security question does not match" 
      });
    }

    // Check security answer (case-insensitive)
    if (faculty.securityAnswer.toLowerCase() !== securityAnswer.toLowerCase().trim()) {
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