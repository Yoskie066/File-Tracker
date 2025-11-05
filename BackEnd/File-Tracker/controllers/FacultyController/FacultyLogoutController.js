import jwt from "jsonwebtoken";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import BlacklistedToken from "../../models/BlacklistedModel/BlacklistedTokenModel.js";

export const logoutFaculty = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "No token provided" });

    // Verify token and get facultyId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { facultyId } = decoded;

    // Add token to blacklist
    await BlacklistedToken.create({ token });

    // Update faculty status to offline - FIXED
    await Faculty.findOneAndUpdate(
      { facultyId }, 
      { status: "offline" },
      { new: true } // Ensure the update is applied
    );

    console.log(`✅ Faculty ${facultyId} logged out - status set to offline`);

    return res.status(200).json({ 
      message: "Faculty logged out successfully" 
    });
  } catch (error) {
    console.error("Faculty Logout Error:", error);
    return res.status(500).json({ 
      message: "Server error during logout",
      error: error.message 
    });
  }
};