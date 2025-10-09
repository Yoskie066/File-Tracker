import jwt from "jsonwebtoken";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import BlacklistedToken from "../../models/BlacklistedModel/BlacklistedTokenModel.js";

export const logoutFaculty = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { facultyId } = decoded;

    await BlacklistedToken.create({ token });

    await Faculty.findOneAndUpdate({ facultyId }, { status: "offline" });

    return res.status(200).json({ message: "Faculty logged out successfully" });
  } catch (error) {
    console.error("Faculty Logout Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
