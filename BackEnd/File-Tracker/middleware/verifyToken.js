import jwt from "jsonwebtoken";
import BlacklistedToken from "../models/BlacklistedModel/BlacklistedTokenModel.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: "No token, authorization denied" 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Check blacklist
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ 
        success: false,
        message: "Token revoked, please login again" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Attach user data to request based on token type
    if (decoded.adminId) {
      req.admin = {
        adminId: decoded.adminId,
        adminName: decoded.adminName || decoded.firstName + ' ' + decoded.lastName,
        email: decoded.email
      };
      console.log('Admin authenticated:', req.admin.adminId);
    } else if (decoded.facultyId) {
      req.faculty = {
        facultyId: decoded.facultyId,
        facultyName: decoded.facultyName || decoded.firstName + ' ' + decoded.lastName,
        email: decoded.email
      };
      console.log('Faculty authenticated:', req.faculty.facultyId);
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload"
      });
    }

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again."
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again."
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error during authentication"
    });
  }
};