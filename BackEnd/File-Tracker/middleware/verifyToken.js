import jwt from "jsonwebtoken";
import BlacklistedToken from "../models/BlacklistedModel/BlacklistedTokenModel.js";

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  // check blacklist
  const blacklisted = await BlacklistedToken.findOne({ token });
  if (blacklisted) return res.status(401).json({ message: "Token revoked, please login again" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // detect user type
    if (decoded.adminId) req.admin = decoded;
    if (decoded.facultyId) req.faculty = decoded;
    
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

