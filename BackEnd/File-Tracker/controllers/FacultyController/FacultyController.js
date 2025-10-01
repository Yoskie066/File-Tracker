import Faculty from '../../models/FacultyModel/FacultyModel.js';

// Helper function para gumawa ng 10-digit random ID
const generateFacultyId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Register Faculty
export const registerFaculty = async (req, res) => {
  try {
    const { facultyName, facultyNumber, password } = req.body;

    const existingFaculty = await Faculty.findOne({ facultyNumber });
    if (existingFaculty) {
      return res.status(400).json({ message: "Faculty already registered" });
    }

    const facultyId = generateFacultyId();

    const newFaculty = new Faculty({
      facultyId,
      facultyName,
      facultyNumber,
      password,
      role: "faculty",
      status: "offline",
      registeredAt: new Date(),
    });

    await newFaculty.save();

    res.status(201).json({ 
      message: "Faculty registered successfully", 
      newFaculty 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error registering faculty", 
      error: error.message 
    });
  }
};

// Login Faculty
export const loginFaculty = async (req, res) => {
  try {
    const { facultyNumber, password } = req.body;
    console.log("LOGIN BODY:", req.body);

    const faculty = await Faculty.findOne({ facultyNumber });
    console.log("FOUND FACULTY:", faculty);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    if (faculty.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", faculty });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
