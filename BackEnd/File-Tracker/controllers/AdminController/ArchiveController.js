import mongoose from "mongoose";
import Archive from "../../models/AdminModel/ArchiveModel.js";
import UserManagement from "../../models/AdminModel/UserManagementModel.js";
import FileManagement from "../../models/AdminModel/FileManagementModel.js";
import AdminNotice from "../../models/AdminModel/AdminNoticeModel.js";
import SystemVariable from "../../models/AdminModel/SystemVariableModel.js";
import Admin from "../../models/AdminModel/AdminModel.js";
import Faculty from "../../models/FacultyModel/FacultyModel.js";
import fs from "fs";
import path from "path";

// Generate 10-digit unique archive ID
const generateArchiveId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// Archive item (move to recycle bin)
export const archiveItem = async (collectionName, originalId, data, deletedBy) => {
  try {
    const archiveId = generateArchiveId();
    
    const archiveRecord = new Archive({
      archive_id: archiveId,
      original_id: originalId,
      collection_name: collectionName,
      data: data,
      deleted_by: deletedBy,
      deleted_at: new Date()
    });

    await archiveRecord.save();
    console.log(`✅ Item archived: ${originalId} from ${collectionName} by ${deletedBy}`);
    
    return { success: true, archive_id: archiveId };
  } catch (error) {
    console.error("❌ Error archiving item:", error);
    throw error;
  }
};

// Get all archived items
export const getArchivedItems = async (req, res) => {
  try {
    const { 
      collection, 
      search, 
      page = 1, 
      limit = 10,
      startDate,
      endDate
    } = req.query;

    const query = { restored: false };
    
    // Filter by collection
    if (collection && collection !== 'all') {
      query.collection_name = collection;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.deleted_at = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.deleted_at.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.deleted_at.$lte = end;
      }
    }
    
    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'data.firstName': searchRegex },
        { 'data.lastName': searchRegex },
        { 'data.fullName': searchRegex },
        { 'data.file_name': searchRegex },
        { 'data.prof_name': searchRegex },
        { 'data.subject_code': searchRegex },
        { 'data.subject_title': searchRegex },
        { 'data.course': searchRegex },
        { 'original_id': searchRegex },
        { 'archive_id': searchRegex },
        { 'deleted_by': searchRegex }
      ];
    }

    const totalItems = await Archive.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const archivedItems = await Archive.find(query)
      .sort({ deleted_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Format items for display with fields matching frontend expectations
    const formattedItems = archivedItems.map(item => {
      const baseItem = {
        archive_id: item.archive_id,
        original_id: item.original_id,
        collection_name: item.collection_name,
        deleted_by: item.deleted_by,
        deleted_at: item.deleted_at,
        full_data: item.data // Include full data for preview
      };

      switch(item.collection_name) {
        case 'users':
          const fullName = `${item.data.firstName || ''} ${item.data.middleInitial || ''}. ${item.data.lastName || ''}`.trim();
          return {
            ...baseItem,
            name: fullName,
            number: item.data.number,
            role: item.data.role,
            status: item.data.status,
            type: 'User Account',
            source_module: 'User Management',
            description: `${item.data.role === 'admin' ? 'Admin' : 'Faculty'} Account - ${item.data.number}`
          };
        case 'files':
          return {
            ...baseItem,
            name: item.data.file_name,
            faculty_name: item.data.faculty_name,
            document_type: item.data.document_type,
            subject_code: item.data.subject_code,
            course: item.data.course,
            semester: item.data.semester,
            school_year: item.data.school_year,
            status: item.data.status,
            type: 'Document File',
            source_module: 'File Management',
            description: `${item.data.document_type} - ${item.data.subject_code || 'No Subject'}`
          };
        case 'admin_notices':
          return {
            ...baseItem,
            name: item.data.prof_name,
            document_type: item.data.document_type,
            due_date: item.data.due_date,
            notes: item.data.notes,
            type: 'Admin Notice',
            source_module: 'Admin Notice Management',
            description: `Notice for ${item.data.document_type}`
          };
        case 'system_variables':
          return {
            ...baseItem,
            name: `${item.data.subject_code} - ${item.data.subject_title}`,
            course: item.data.course,
            semester: item.data.semester,
            academic_year: item.data.academic_year,
            type: 'System Configuration',
            source_module: 'System Variables',
            description: `System variable for ${item.data.subject_code}`
          };
        default:
          return { 
            ...baseItem, 
            name: 'Unknown Item',
            type: 'Unknown',
            source_module: 'Unknown',
            description: 'Unknown item type'
          };
      }
    });

    // Get statistics
    const stats = await Archive.aggregate([
      { $match: { restored: false } },
      { $group: { 
        _id: '$collection_name', 
        count: { $sum: 1 } 
      }}
    ]);

    const statsObject = {
      total: totalItems,
      users: stats.find(s => s._id === 'users')?.count || 0,
      files: stats.find(s => s._id === 'files')?.count || 0,
      admin_notices: stats.find(s => s._id === 'admin_notices')?.count || 0,
      system_variables: stats.find(s => s._id === 'system_variables')?.count || 0
    };

    res.status(200).json({
      success: true,
      data: formattedItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit)
      },
      stats: statsObject
    });

  } catch (error) {
    console.error("❌ Error fetching archived items:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archived items",
      error: error.message
    });
  }
};

// Get archived item by ID
export const getArchivedItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const archivedItem = await Archive.findOne({ 
      archive_id: id, 
      restored: false 
    });

    if (!archivedItem) {
      return res.status(404).json({
        success: false,
        message: "Archived item not found"
      });
    }

    res.status(200).json({
      success: true,
      data: archivedItem
    });

  } catch (error) {
    console.error("❌ Error fetching archived item:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archived item",
      error: error.message
    });
  }
};

// Restore item from archive to original location
export const restoreItem = async (req, res) => {
  try {
    const { id } = req.params;
    const restoredBy = req.admin?.adminName || req.admin?.firstName || 'System';
    
    console.log(`🔄 Attempting to restore item: ${id} by ${restoredBy}`);
    
    // Find archived item
    const archivedItem = await Archive.findOne({ 
      archive_id: id, 
      restored: false 
    });

    if (!archivedItem) {
      return res.status(404).json({
        success: false,
        message: "Archived item not found or already restored"
      });
    }

    const { collection_name, original_id, data } = archivedItem;
    let restoredDocument = null;

    console.log(`📦 Restoring ${collection_name} with ID: ${original_id}`);

    // Restore based on collection type
    switch(collection_name) {
      case 'users':
        if (data.role === 'admin') {
          // Check if admin already exists
          const existingAdmin = await Admin.findOne({ adminId: original_id });
          if (existingAdmin) {
            return res.status(400).json({
              success: false,
              message: "Admin with this ID already exists in the system"
            });
          }

          // Create new admin from archived data
          restoredDocument = new Admin({
            adminId: data.user_id || original_id,
            firstName: data.firstName,
            lastName: data.lastName,
            middleInitial: data.middleInitial,
            adminNumber: data.number,
            password: data.password,
            securityQuestion: data.securityQuestion,
            securityAnswer: data.securityAnswer,
            role: 'admin',
            status: 'offline',
            registeredAt: data.created_at || new Date()
          });
        } else {
          // Check if faculty already exists
          const existingFaculty = await Faculty.findOne({ facultyId: original_id });
          if (existingFaculty) {
            return res.status(400).json({
              success: false,
              message: "Faculty with this ID already exists in the system"
            });
          }

          // Create new faculty from archived data
          restoredDocument = new Faculty({
            facultyId: data.user_id || original_id,
            firstName: data.firstName,
            lastName: data.lastName,
            middleInitial: data.middleInitial,
            facultyNumber: data.number,
            password: data.password,
            securityQuestion: data.securityQuestion,
            securityAnswer: data.securityAnswer,
            role: 'faculty',
            status: 'offline',
            registeredAt: data.created_at || new Date()
          });
        }
        break;

      case 'files':
        // Check if file already exists
        const existingFile = await FileManagement.findOne({ file_id: original_id });
        if (existingFile) {
          return res.status(400).json({
            success: false,
            message: "File with this ID already exists in File Management"
          });
        }
        
        // Check if physical file exists
        if (data.file_path) {
          const filePath = path.join(process.cwd(), data.file_path);
          if (!fs.existsSync(filePath)) {
            return res.status(404).json({
              success: false,
              message: "Physical file not found in storage, cannot restore"
            });
          }
        }
        
        // Create new file record from archived data
        restoredDocument = new FileManagement({
          file_id: data.file_id || original_id,
          faculty_id: data.faculty_id,
          faculty_name: data.faculty_name,
          file_name: data.file_name,
          document_type: data.document_type,
          tos_type: data.tos_type,
          status: 'pending',
          subject_code: data.subject_code,
          subject_title: data.subject_title,
          course: data.course,
          semester: data.semester,
          school_year: data.school_year,
          file_path: data.file_path,
          original_name: data.original_name,
          file_size: data.file_size,
          uploaded_at: data.uploaded_at || new Date(),
          due_date: data.due_date
        });
        break;

      case 'admin_notices':
        // Check if notice already exists
        const existingNotice = await AdminNotice.findOne({ notice_id: original_id });
        if (existingNotice) {
          return res.status(400).json({
            success: false,
            message: "Admin notice with this ID already exists"
          });
        }
        
        // Create new admin notice from archived data
        restoredDocument = new AdminNotice({
          notice_id: data.notice_id || original_id,
          prof_name: data.prof_name,
          faculty_id: data.faculty_id || '',
          document_type: data.document_type,
          tos_type: data.tos_type || 'N/A',
          due_date: data.due_date,
          notes: data.notes || '',
          created_at: data.created_at || new Date(),
          updated_at: new Date()
        });
        break;

      case 'system_variables':
        // Check if variable already exists
        const existingVariable = await SystemVariable.findOne({ variable_id: original_id });
        if (existingVariable) {
          return res.status(400).json({
            success: false,
            message: "System variable with this ID already exists"
          });
        }
        
        // Create new system variable from archived data
        restoredDocument = new SystemVariable({
          variable_id: data.variable_id || original_id,
          subject_code: data.subject_code,
          subject_title: data.subject_title,
          course: data.course,
          semester: data.semester,
          academic_year: data.academic_year,
          created_by: data.created_by || 'System (Restored)',
          created_at: data.created_at || new Date(),
          updated_at: new Date()
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid collection type for restoration"
        });
    }

    // Save the restored document
    if (restoredDocument) {
      await restoredDocument.save();
      console.log(`✅ Successfully restored ${collection_name}: ${original_id}`);
    }

    // Mark archive record as restored
    archivedItem.restored = true;
    archivedItem.restored_at = new Date();
    archivedItem.restored_by = restoredBy;
    await archivedItem.save();

    res.status(200).json({
      success: true,
      message: `Item successfully restored to ${collection_name.replace('_', ' ')}`,
      data: {
        original_id: original_id,
        collection_name: collection_name,
        restored_at: archivedItem.restored_at,
        restored_by: archivedItem.restored_by
      }
    });

  } catch (error) {
    console.error("❌ Error restoring item:", error);
    
    // Handle specific errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry: This item already exists in the system",
        error: "Duplicate key error"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error restoring item",
      error: error.message
    });
  }
};

// Permanently delete item from archive (COMPLETE REMOVAL)
export const permanentlyDeleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.admin?.adminName || req.admin?.firstName || 'System';
    
    console.log(`🗑️ Attempting permanent delete from archive: ${id} by ${deletedBy}`);
    
    // Find archived item
    const archivedItem = await Archive.findOne({ archive_id: id });
    
    if (!archivedItem) {
      return res.status(404).json({
        success: false,
        message: "Archived item not found"
      });
    }

    const { collection_name, original_id, data } = archivedItem;

    // If it's a file, delete the physical file from storage
    if (collection_name === 'files' && data.file_path) {
      try {
        // Remove leading slash if present
        const filePath = data.file_path.startsWith('/') 
          ? data.file_path.substring(1) 
          : data.file_path;
        
        const fullPath = path.join(process.cwd(), filePath);
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`🗑️ Deleted physical file: ${fullPath}`);
        } else {
          console.log(`⚠️ Physical file not found: ${fullPath}`);
        }
      } catch (fileError) {
        console.error("⚠️ Error deleting physical file:", fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Permanently delete from archive collection
    await Archive.deleteOne({ archive_id: id });

    console.log(`✅ Permanently deleted from archive: ${original_id} (${collection_name})`);

    res.status(200).json({
      success: true,
      message: "Item permanently deleted from archive",
      data: {
        original_id: original_id,
        collection_name: collection_name,
        permanently_deleted_at: new Date(),
        deleted_by: deletedBy
      }
    });

  } catch (error) {
    console.error("❌ Error permanently deleting item:", error);
    res.status(500).json({
      success: false,
      message: "Error permanently deleting item from archive",
      error: error.message
    });
  }
};

// Bulk restore items
export const bulkRestoreItems = async (req, res) => {
  try {
    const { archive_ids } = req.body;
    const restoredBy = req.admin?.adminName || req.admin?.firstName || 'System';
    
    if (!Array.isArray(archive_ids) || archive_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of archive IDs"
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    console.log(`🔄 Bulk restore initiated for ${archive_ids.length} items by ${restoredBy}`);

    // Process each item individually
    for (const archiveId of archive_ids) {
      try {
        const archivedItem = await Archive.findOne({ 
          archive_id: archiveId, 
          restored: false 
        });

        if (!archivedItem) {
          results.failed.push({
            archive_id: archiveId,
            reason: "Item not found or already restored"
          });
          continue;
        }

        const { collection_name, original_id, data } = archivedItem;

        // Call the restore function for each item
        const restoreResponse = await fetch(`http://localhost:3000/api/admin/archive/${archiveId}/restore`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          }
        });

        if (restoreResponse.ok) {
          results.successful.push({
            archive_id: archiveId,
            original_id: original_id,
            collection_name: collection_name
          });
        } else {
          const errorData = await restoreResponse.json();
          results.failed.push({
            archive_id: archiveId,
            reason: errorData.message || "Restoration failed"
          });
        }

      } catch (itemError) {
        results.failed.push({
          archive_id: archiveId,
          reason: itemError.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk restore completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    console.error("❌ Error in bulk restore:", error);
    res.status(500).json({
      success: false,
      message: "Error performing bulk restore",
      error: error.message
    });
  }
};

// Bulk permanent delete
export const bulkPermanentDelete = async (req, res) => {
  try {
    const { archive_ids } = req.body;
    const deletedBy = req.admin?.adminName || req.admin?.firstName || 'System';
    
    if (!Array.isArray(archive_ids) || archive_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of archive IDs"
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    console.log(`🗑️ Bulk permanent delete initiated for ${archive_ids.length} items by ${deletedBy}`);

    for (const archiveId of archive_ids) {
      try {
        const archivedItem = await Archive.findOne({ archive_id: archiveId });
        
        if (!archivedItem) {
          results.failed.push({
            archive_id: archiveId,
            reason: "Item not found in archive"
          });
          continue;
        }

        const { collection_name, original_id, data } = archivedItem;

        // Delete physical file if it's a file
        if (collection_name === 'files' && data.file_path) {
          try {
            const filePath = data.file_path.startsWith('/') 
              ? data.file_path.substring(1) 
              : data.file_path;
            
            const fullPath = path.join(process.cwd(), filePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          } catch (fileError) {
            console.error(`⚠️ Error deleting physical file for ${archiveId}:`, fileError);
          }
        }

        // Delete from archive collection
        await Archive.deleteOne({ archive_id: archiveId });
        
        results.successful.push({
          archive_id: archiveId,
          original_id: original_id,
          collection_name: collection_name
        });

      } catch (itemError) {
        results.failed.push({
          archive_id: archiveId,
          reason: itemError.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk permanent delete completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      data: results
    });

  } catch (error) {
    console.error("❌ Error in bulk permanent delete:", error);
    res.status(500).json({
      success: false,
      message: "Error performing bulk permanent delete",
      error: error.message
    });
  }
};

// Get archive statistics
export const getArchiveStats = async (req, res) => {
  try {
    // Total items by collection
    const byCollection = await Archive.aggregate([
      { $group: { 
        _id: '$collection_name', 
        total: { $sum: 1 },
        restored: { 
          $sum: { $cond: [{ $eq: ['$restored', true] }, 1, 0] } 
        },
        not_restored: { 
          $sum: { $cond: [{ $eq: ['$restored', false] }, 1, 0] } 
        }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Items deleted in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentItems = await Archive.countDocuments({
      deleted_at: { $gte: thirtyDaysAgo },
      restored: false
    });

    // Most active deleters
    const topDeleters = await Archive.aggregate([
      { $group: { 
        _id: '$deleted_by', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Items by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const itemsByMonth = await Archive.aggregate([
      { 
        $match: { 
          deleted_at: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$deleted_at" },
            month: { $month: "$deleted_at" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_items: await Archive.countDocuments(),
        active_items: await Archive.countDocuments({ restored: false }),
        by_collection: byCollection,
        recent_items_30_days: recentItems,
        top_deleters: topDeleters,
        items_by_month: itemsByMonth
      }
    });

  } catch (error) {
    console.error("❌ Error fetching archive stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archive statistics",
      error: error.message
    });
  }
};

// Get unique collections for filter dropdown
export const getArchiveCollections = async (req, res) => {
  try {
    const collections = await Archive.aggregate([
      { 
        $group: { 
          _id: '$collection_name',
          count: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: collections.map(c => ({
        value: c._id,
        label: c._id.replace('_', ' ').charAt(0).toUpperCase() + c._id.replace('_', ' ').slice(1),
        count: c.count
      }))
    });

  } catch (error) {
    console.error("❌ Error fetching archive collections:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archive collections",
      error: error.message
    });
  }
};