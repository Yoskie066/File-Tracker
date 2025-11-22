import mongoose from "mongoose";

const adminDeliverablesSchema = new mongoose.Schema(
  {
    deliverable_id: { 
      type: String, 
      required: true, 
      unique: true 
    },
    faculty_id: { 
      type: String, 
      required: true 
    },
    faculty_name: { 
      type: String, 
      required: true 
    },
    subject_code: { 
      type: String, 
      required: true 
    },
    course_section: { 
      type: String, 
      required: true 
    },
    file_name: { 
      type: String, 
      required: true 
    },
    file_type: { 
      type: String, 
      required: true,
      enum: ['syllabus', 'tos', 'tos-midterm', 'tos-final', 'midterm-exam', 'final-exam', 'instructional-materials'] 
    },
    tos_type: {  
      type: String,
      enum: ['midterm', 'final', null],
      default: null
    },
    status: { 
      type: String, 
      enum: ["pending", "completed", "rejected"], 
      default: "pending" 
    },
    uploaded_at: { 
      type: Date, 
      default: Date.now 
    },
    synced_at: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    versionKey: false 
  }
);

// Index for better query performance
adminDeliverablesSchema.index({ faculty_id: 1, uploaded_at: -1 });
adminDeliverablesSchema.index({ subject_code: 1, course_section: 1 });
adminDeliverablesSchema.index({ status: 1 });

const AdminDeliverables = mongoose.model("AdminDeliverables", adminDeliverablesSchema);
export default AdminDeliverables;