import jwt from "jsonwebtoken";
import Admin from "../../models/AdminModel/AdminModel.js";
import BlacklistedToken from "../../models/BlacklistedModel/BlacklistedTokenModel.js";

export const logoutAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { adminId } = decoded;

    await BlacklistedToken.create({ token });
    await Admin.findOneAndUpdate({ adminId }, { status: "offline" });

    return res.status(200).json({ message: "Admin logged out successfully" });
  } catch (error) {
    console.error("Admin Logout Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};