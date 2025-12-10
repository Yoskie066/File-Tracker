import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
      unique: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate: {
        validator: function(v) {
          return v.length >= 8;
        },
        message: "Admin name must be at least 8 characters long"
      }
    },
    adminNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{8,}$/, "Admin number must be at least 8 digits"],
      validate: {
        validator: function(v) {
          return /^\d{8,}$/.test(v);
        },
        message: "Admin number must contain at least 8 digits"
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 4,
    },
    role: {
      type: String,
      default: "admin",
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Admin || mongoose.model("Admin", adminSchema);