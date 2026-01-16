import Admin from "../../models/AdminModel/AdminModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import { archiveItem } from "../../controllers/AdminController/ArchiveController.js";
import bcrypt from "bcrypt";

const generateUserId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Security questions array
const securityQuestions = [
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

// Combine Admin + Faculty users with accurate status tracking
export const getAllUsers = async (req, res) => {
  try {
    const admins = await Admin.find().lean();
    const faculties = await Faculty.find().lean();

    // Process users and ensure accurate status
    const combinedUsers = [
      ...admins.map((a) => ({
        user_id: a.adminId,
        firstName: a.firstName,
        lastName: a.lastName,
        middleInitial: a.middleInitial,
        fullName: `${a.firstName} ${a.middleInitial}. ${a.lastName}`,
        number: a.adminNumber,
        role: a.role || 'admin',
        status: a.status || 'offline',
        security_question: a.securityQuestion || 'Not set',
        password: "••••••••", 
        created_at: a.registeredAt || a.createdAt,
      })),
      ...faculties.map((f) => ({
        user_id: f.facultyId,
        firstName: f.firstName,
        lastName: f.lastName,
        middleInitial: f.middleInitial,
        fullName: `${f.firstName} ${f.middleInitial}. ${f.lastName}`,
        number: f.facultyNumber,
        role: f.role || 'faculty',
        status: f.status || 'offline',
        security_question: f.securityQuestion || 'Not set',
        password: "••••••••", 
        created_at: f.registeredAt || f.createdAt,
      }))
    ];

    console.log(`User Management Stats: Total: ${combinedUsers.length}, Online: ${combinedUsers.filter(u => u.status === 'online').length}, Offline: ${combinedUsers.filter(u => u.status === 'offline').length}`);

    res.status(200).json(combinedUsers);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

// Register new user (admin or faculty)
export const registerUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      middleInitial, 
      number, 
      password, 
      role, 
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

    // Validate middle initial (single uppercase letter)
    const middleInitialRegex = /^[A-Z]$/;
    if (!middleInitialRegex.test(middleInitial)) {
      return res.status(400).json({ 
        message: "Middle initial must be a single uppercase letter (A-Z)" 
      });
    }

    // Validate number format - minimum 2 digits, numbers only
    const numberRegex = /^\d{2,}$/;
    if (!numberRegex.test(number)) {
      return res.status(400).json({ 
        message: "Number must contain only numbers (minimum 2 digits)" 
      });
    }

    // Validate role
    if (!['admin', 'faculty'].includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role" 
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

    // Validate password
    if (password.length < 4) {
      return res.status(400).json({ 
        message: "Password must be at least 4 characters long" 
      });
    }

    // Check if number exists in any role
    if (role === 'admin') {
      const existingAdmin = await Admin.findOne({ adminNumber: number });
      const existingFaculty = await Faculty.findOne({ facultyNumber: number });
      
      if (existingAdmin || existingFaculty) {
        return res.status(400).json({ 
          message: "This number is already registered" 
        });
      }
    } else {
      const existingFaculty = await Faculty.findOne({ facultyNumber: number });
      const existingAdmin = await Admin.findOne({ adminNumber: number });
      
      if (existingFaculty || existingAdmin) {
        return res.status(400).json({ 
          message: "This number is already registered" 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId();

    if (role === 'admin') {
      const newAdmin = new Admin({
        adminId: userId,
        firstName,
        lastName,
        middleInitial,
        adminNumber: number,
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
        userId: newAdmin.adminId,
        fullName: `${newAdmin.firstName} ${newAdmin.middleInitial}. ${newAdmin.lastName}`,
      });
    } else {
      const newFaculty = new Faculty({
        facultyId: userId,
        firstName,
        lastName,
        middleInitial,
        facultyNumber: number,
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
        userId: newFaculty.facultyId,
        fullName: `${newFaculty.firstName} ${newFaculty.middleInitial}. ${newFaculty.lastName}`,
      });
    }
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
        message: "Number already exists" 
      });
    }
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check in Admin collection
    let user = await Admin.findOne({ adminId: id });
    if (user) {
      return res.status(200).json({
        success: true,
        data: {
          user_id: user.adminId,
          firstName: user.firstName,
          lastName: user.lastName,
          middleInitial: user.middleInitial,
          number: user.adminNumber,
          role: 'admin',
          security_question: user.securityQuestion,
          created_at: user.registeredAt
        }
      });
    }
    
    // Check in Faculty collection
    user = await Faculty.findOne({ facultyId: id });
    if (user) {
      return res.status(200).json({
        success: true,
        data: {
          user_id: user.facultyId,
          firstName: user.firstName,
          lastName: user.lastName,
          middleInitial: user.middleInitial,
          number: user.facultyNumber,
          role: 'faculty',
          security_question: user.securityQuestion,
          created_at: user.registeredAt
        }
      });
    }
    
    return res.status(404).json({ 
      success: false,
      message: "User not found" 
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user", 
      error: err.message 
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, 
      lastName, 
      middleInitial, 
      number, 
      role, 
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

    // Validate middle initial (single uppercase letter)
    const middleInitialRegex = /^[A-Z]$/;
    if (!middleInitialRegex.test(middleInitial)) {
      return res.status(400).json({ 
        message: "Middle initial must be a single uppercase letter (A-Z)" 
      });
    }

    // Validate number format - minimum 2 digits, numbers only
    const numberRegex = /^\d{2,}$/;
    if (!numberRegex.test(number)) {
      return res.status(400).json({ 
        message: "Number must contain only numbers (minimum 2 digits)" 
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

    // Check if number exists in other users
    if (role === 'admin') {
      const existingAdmin = await Admin.findOne({ 
        adminNumber: number, 
        adminId: { $ne: id } 
      });
      const existingFaculty = await Faculty.findOne({ facultyNumber: number });
      
      if (existingAdmin || existingFaculty) {
        return res.status(400).json({ 
          message: "This number is already registered" 
        });
      }

      const updatedAdmin = await Admin.findOneAndUpdate(
        { adminId: id },
        {
          firstName,
          lastName,
          middleInitial,
          adminNumber: number,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
        },
        { new: true }
      );

      if (!updatedAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.status(200).json({
        message: "Admin updated successfully",
        user: updatedAdmin
      });
    } else {
      const existingFaculty = await Faculty.findOne({ 
        facultyNumber: number, 
        facultyId: { $ne: id } 
      });
      const existingAdmin = await Admin.findOne({ adminNumber: number });
      
      if (existingFaculty || existingAdmin) {
        return res.status(400).json({ 
          message: "This number is already registered" 
        });
      }

      const updatedFaculty = await Faculty.findOneAndUpdate(
        { facultyId: id },
        {
          firstName,
          lastName,
          middleInitial,
          facultyNumber: number,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
        },
        { new: true }
      );

      if (!updatedFaculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      res.status(200).json({
        message: "Faculty updated successfully",
        user: updatedFaculty
      });
    }
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
        message: "Number already exists" 
      });
    }
    res.status(500).json({
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const deletedBy = req.admin?.adminName || 'System';
    
    const admin = await Admin.findOne({ adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Archive before deleting
    const archiveData = {
      user_id: admin.adminId,
      firstName: admin.firstName,
      lastName: admin.lastName,
      middleInitial: admin.middleInitial,
      number: admin.adminNumber,
      password: admin.password,
      role: admin.role || 'admin',
      securityQuestion: admin.securityQuestion,
      securityAnswer: admin.securityAnswer,
      status: admin.status || 'offline',
      created_at: admin.registeredAt || admin.createdAt
    };

    await archiveItem('users', admin.adminId, archiveData, deletedBy);

    // Delete from original collection
    await Admin.findOneAndDelete({ adminId });

    console.log(`Admin archived: ${admin.firstName} ${admin.middleInitial}. ${admin.lastName} (${admin.adminId})`);
    
    res.status(200).json({ 
      message: "Admin moved to archive",
      deletedAdmin: {
        adminId: admin.adminId,
        name: `${admin.firstName} ${admin.middleInitial}. ${admin.lastName}`
      }
    });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ message: "Error deleting admin", error: err.message });
  }
};

// Delete faculty
export const deleteFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const deletedBy = req.admin?.adminName || 'System';
    
    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    // Archive before deleting
    const archiveData = {
      user_id: faculty.facultyId,
      firstName: faculty.firstName,
      lastName: faculty.lastName,
      middleInitial: faculty.middleInitial,
      number: faculty.facultyNumber,
      password: faculty.password,
      role: faculty.role || 'faculty',
      securityQuestion: faculty.securityQuestion,
      securityAnswer: faculty.securityAnswer,
      status: faculty.status || 'offline',
      created_at: faculty.registeredAt || faculty.createdAt
    };

    await archiveItem('users', faculty.facultyId, archiveData, deletedBy);

    // Delete from original collection
    await Faculty.findOneAndDelete({ facultyId });

    console.log(`Faculty archived: ${faculty.firstName} ${faculty.middleInitial}. ${faculty.lastName} (${faculty.facultyId})`);
    
    res.status(200).json({ 
      message: "Faculty moved to archive",
      deletedFaculty: {
        facultyId: faculty.facultyId,
        name: `${faculty.firstName} ${faculty.middleInitial}. ${faculty.lastName}`
      }
    });
  } catch (err) {
    console.error("Error deleting faculty:", err);
    res.status(500).json({ message: "Error deleting faculty", error: err.message });
  }
};