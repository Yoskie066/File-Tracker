import Admin from "../../models/AdminModel/AdminModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

// Combine Admin + Faculty users
export const getAllUsers = async (req, res) => {
  try {
    const admins = await Admin.find().lean();
    const faculties = await Faculty.find().lean();

    const combinedUsers = [
      ...admins.map((a) => ({
        user_id: a.adminId,
        name: a.adminName,
        number: a.adminNumber,
        role: a.role,
        status: a.status,
        password: "••••••••", 
        created_at: a.registeredAt,
      })),
      ...faculties.map((f) => ({
        user_id: f.facultyId,
        name: f.facultyName,
        number: f.facultyNumber,
        role: f.role,
        status: f.status,
        password: "••••••••", 
        created_at: f.registeredAt,
      }))
    ];

    res.status(200).json(combinedUsers);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};