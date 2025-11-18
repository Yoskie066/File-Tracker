import mongoose from "mongoose";

const adminDeliverablesSchema = new mongoose.Schema(
  {
    deliverable_id: { type: String, required: true, unique: true },
    faculty_id: { type: String, required: true },
    faculty_name: { type: String, required: true },
    subject_code: { type: String, required: true },
    semester: { type: String, required: true },
    school_year: { type: String, required: true },
    file_name: { type: String, required: true },
    file_type: { 
      type: String, 
      required: true,
      enum: ['syllabus', 'tos', 'midterm-exam', 'final-exam', 'instructional-materials']
    },
    date_submitted: { type: Date, required: true },
    status: { 
      type: String, 
      default: "completed", 
      enum: ["pending", "completed", "rejected"]
    },
    course_section: { type: String, required: true }
  },
  { 
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes for better query performance
adminDeliverablesSchema.index({ faculty_id: 1, date_submitted: -1 });
adminDeliverablesSchema.index({ subject_code: 1, course_section: 1 });
adminDeliverablesSchema.index({ semester: 1, school_year: 1 });
adminDeliverablesSchema.index({ file_type: 1 });

const AdminDeliverables = mongoose.model("AdminDeliverables", adminDeliverablesSchema);
export default AdminDeliverables;