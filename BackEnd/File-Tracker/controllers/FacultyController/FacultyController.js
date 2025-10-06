import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

const generateFacultyId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Register Faculty
export const registerFaculty = async (req, res) => {
  try {
    const { facultyName, facultyNumber, password } = req.body;

    // check if already exists
    const existingFaculty = await Faculty.findOne({ facultyNumber });
    if (existingFaculty) {
      return res.status(400).json({ message: "Faculty already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const facultyId = generateFacultyId();

    const newFaculty = new Faculty({
      facultyId,
      facultyName,
      facultyNumber,
      password: hashedPassword,
      role: "faculty",
      status: "offline",
      registeredAt: new Date(),
    });

    await newFaculty.save();

    res.status(201).json({
      message: "Faculty registered successfully",
      facultyId: newFaculty.facultyId,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering faculty",
      error: error.message,
    });
  }
};

// Login Faculty
export const loginFaculty = async (req, res) => {
  try {
    const { facultyNumber, password } = req.body;

    const faculty = await Faculty.findOne({ facultyNumber });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    console.log("LOGIN REQUEST BODY:", req.body);
    console.log("FOUND FACULTY:", faculty.facultyNumber, faculty.facultyName);

    let isPasswordValid = false;

    // check kung naka-hash na yung password
    if (faculty.password.startsWith("$2b$") || faculty.password.startsWith("$2a$")) {
      console.log("Password type: bcrypt hash");
      isPasswordValid = await bcrypt.compare(password, faculty.password);
    } else {
      console.log("Password type: plain text");
      if (faculty.password === password) {
        console.log("Plain text matched, hashing now...");
        const hashedPassword = await bcrypt.hash(password, 10);
        faculty.password = hashedPassword;
        await faculty.save();
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      console.log("Invalid credentials");
      return res.status(400).json({ message: "Invalid credentials" });
    }

    faculty.status = "online";
    await faculty.save();

    // generate JWT
    const token = jwt.sign(
      {
        facultyId: faculty.facultyId,
        facultyName: faculty.facultyName,
        role: faculty.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      faculty: {
        facultyId: faculty.facultyId,
        facultyName: faculty.facultyName,
        facultyNumber: faculty.facultyNumber,
        role: faculty.role,
        status: faculty.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};