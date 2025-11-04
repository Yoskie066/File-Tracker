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
        role: a.role || 'admin',
        status: a.status || 'offline',
        password: "••••••••", 
        created_at: a.registeredAt || a.createdAt,
      })),
      ...faculties.map((f) => ({
        user_id: f.facultyId,
        name: f.facultyName,
        number: f.facultyNumber,
        role: f.role || 'faculty',
        status: f.status || 'offline',
        password: "••••••••", 
        created_at: f.registeredAt || f.createdAt,
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

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const admin = await Admin.findOneAndDelete({ adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    console.log(`🗑️ Admin deleted: ${admin.adminName} (${admin.adminId})`);
    res.status(200).json({ 
      message: "Admin deleted successfully",
      deletedAdmin: {
        adminId: admin.adminId,
        name: admin.adminName
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
    
    const faculty = await Faculty.findOneAndDelete({ facultyId });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    console.log(`🗑️ Faculty deleted: ${faculty.facultyName} (${faculty.facultyId})`);
    res.status(200).json({ 
      message: "Faculty deleted successfully",
      deletedFaculty: {
        facultyId: faculty.facultyId,
        name: faculty.facultyName
      }
    });
  } catch (err) {
    console.error("Error deleting faculty:", err);
    res.status(500).json({ message: "Error deleting faculty", error: err.message });
  }
};