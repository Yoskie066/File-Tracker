import Admin from "../../models/AdminModel/AdminModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

// Combine Admin + Faculty users with accurate status tracking
export const getAllUsers = async (req, res) => {
  try {
    const admins = await Admin.find().lean();
    const faculties = await Faculty.find().lean();

    // Process users and ensure accurate status
    const combinedUsers = [
      ...admins.map((a) => ({
        user_id: a.adminId,
        name: a.adminName,
        number: a.adminNumber,
        role: a.role || 'admin', // Ensure role is set
        status: a.status || 'offline', // Ensure status is set, default to offline
        password: "••••••••", 
        created_at: a.registeredAt,
      })),
      ...faculties.map((f) => ({
        user_id: f.facultyId,
        name: f.facultyName,
        number: f.facultyNumber,
        role: f.role || 'faculty', // Ensure role is set
        status: f.status || 'offline', // Ensure status is set, default to offline
        password: "••••••••", 
        created_at: f.registeredAt,
      }))
    ];

    // Log for debugging
    console.log(`📊 User Management Stats: Total: ${combinedUsers.length}, Online: ${combinedUsers.filter(u => u.status === 'online').length}, Offline: ${combinedUsers.filter(u => u.status === 'offline').length}`);

    res.status(200).json(combinedUsers);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};