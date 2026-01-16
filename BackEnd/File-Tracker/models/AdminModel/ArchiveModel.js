import mongoose from "mongoose";

const archiveSchema = new mongoose.Schema(
  {
    archive_id: { 
      type: String, 
      required: true, 
      unique: true 
    },
    original_id: { 
      type: String, 
      required: true 
    },
    collection_name: { 
      type: String, 
      required: true,
      enum: ['users', 'files', 'admin_notices', 'system_variables']
    },
    data: { 
      type: mongoose.Schema.Types.Mixed, 
      required: true 
    },
    deleted_by: { 
      type: String, 
      required: true 
    },
    deleted_at: { 
      type: Date, 
      default: Date.now 
    },
    restored: { 
      type: Boolean, 
      default: false 
    },
    restored_at: { 
      type: Date 
    },
    restored_by: { 
      type: String 
    }
  },
  { 
    versionKey: false,
    timestamps: false 
  }
);

// Index for searching
archiveSchema.index({ collection_name: 1, original_id: 1 });
archiveSchema.index({ deleted_at: -1 });
archiveSchema.index({ restored: 1 });

const Archive = mongoose.model("Archive", archiveSchema);
export default Archive;