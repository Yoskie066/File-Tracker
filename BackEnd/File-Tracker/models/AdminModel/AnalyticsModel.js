import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    analytics_id: { type: String, required: true, unique: true },
    period: { type: String, required: true },
    date: { type: Date, required: true },
    
    // User Management Stats
    user_stats: {
      total_users: Number,
      online_users: Number,
      offline_users: Number,
      admin_count: Number,
      faculty_count: Number,
      active_rate: Number,
      online_status_distribution: {
        online: Number,
        offline: Number
      }
    },
    
    // File Management Stats
    file_stats: {
      total_files: Number,
      pending_files: Number,
      completed_files: Number,
      rejected_files: Number,
      document_type_distribution: {
        syllabus: Number,
        'tos-midterm': Number,
        'tos-final': Number,
        'midterm-exam': Number,
        'final-exam': Number,
        'instructional-materials': Number
      }
    },
    
    // Requirement Management Stats
    requirement_stats: {
      total_requirements: Number,
      overdue_requirements: Number,
      not_overdue_requirements: Number,
      completion_rate: Number
    },
    
    // System Variables Stats
    system_variable_stats: {
      total_variables: Number,
      variable_type_distribution: {
        subject_code: Number,
        course_section: Number,
        academic_year: Number,
        semester: Number
      }
    }
  },
  { 
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes for better query performance
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ period: 1, date: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);
export default Analytics;