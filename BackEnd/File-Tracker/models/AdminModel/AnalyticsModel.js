import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    analytics_id: {
      type: String,
      required: true,
      unique: true,
    },
    period: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // User Management Stats
    user_management: {
      total_users: Number,
      online_users: Number,
      offline_users: Number,
      admin_count: Number,
      faculty_count: Number,
      active_rate: Number,
      online_status_distribution: {
        online: Number,
        offline: Number,
      },
    },
    // File Management Stats 
    file_management: {
      total_files: Number,
      pending_files: Number,
      completed_files: Number,
      rejected_files: Number,
      late_files: Number,
      document_type_distribution: {
        syllabus: Number,
        "tos-midterm": Number,
        "tos-final": Number,
        "midterm-exam": Number,
        "final-exam": Number,
        "instructional-materials": Number,
      },
      semester_distribution: {
        "1st_semester": Number,
        "2nd_semester": Number,
        summer: Number,
      },
    },
    // Admin Notice Stats
    admin_notice_management: {
      total_notices: Number,
      overdue_notices: Number,
      not_overdue_notices: Number,
      completion_rate: Number,
      document_type_distribution: {
        syllabus: Number,
        "tos-midterm": Number,
        "tos-final": Number,
        "midterm-exam": Number,
        "final-exam": Number,
        "instructional-materials": Number,
        "all-files": Number,
      },
    },
    // System Variables Stats - UPDATED STRUCTURE
    system_variables: {
      total_variables: Number,
      bscs_count: Number,
      bsit_count: Number,
      distinct_subjects_count: Number,
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes for better query performance
analyticsSchema.index({ date: -1 });
analyticsSchema.index({ period: 1, date: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;