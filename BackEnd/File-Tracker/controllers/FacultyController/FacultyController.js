import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Faculty from "../../models/FacultyModel/FacultyModel.js";

const generateFacultyId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// REGISTER FACULTY
export const registerFaculty = async (req, res) => {
  try {
    const { facultyName, facultyNumber, password } = req.body;

    const existingFaculty = await Faculty.findOne({ facultyNumber });
    if (existingFaculty) {
      return res.status(400).json({ message: "Faculty already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const facultyId = generateFacultyId();

    const newFaculty = new Faculty({
      facultyId,
      facultyName,
      facultyNumber,
      password: hashedPassword,
      tempPlainPassword: password,
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

// LOGIN FACULTY
export const loginFaculty = async (req, res) => {
  try {
    const { facultyNumber, password } = req.body;

    let faculty = await Faculty.findOne({ facultyNumber });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    let isPasswordValid = false;

    // Check kung naka-hash na yung password
    if (faculty.password.startsWith("$2b$") || faculty.password.startsWith("$2a$")) {
      isPasswordValid = await bcrypt.compare(password, faculty.password);
    } else {
      // Convert plain password to hash kung plain text pa
      if (faculty.password === password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        faculty.password = hashedPassword;
        await faculty.save();
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ALTERNATIVE: Mas reliable na paraan - set all faculties individually
    const allFaculties = await Faculty.find({});
    for (let fac of allFaculties) {
      fac.status = fac.facultyId === faculty.facultyId ? "online" : "offline";
      await fac.save();
    }

    // Re-fetch ang current faculty para sa updated data
    faculty = await Faculty.findOne({ facultyNumber });

    // Generate JWT token
    const token = jwt.sign(
      {
        facultyId: faculty.facultyId,
        facultyName: faculty.facultyName,
        role: faculty.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
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
    console.error("Faculty Login Error:", error);
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};

