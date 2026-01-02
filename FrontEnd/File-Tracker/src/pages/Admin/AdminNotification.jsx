import { useState, useEffect } from "react";
import useAdminNotification from "../../hooks/useAdminNotification";
import Modal from "react-modal";
import { Check, Archive, Eye, Trash2, FileText, Calendar, BookOpen, User, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

Modal.setAppElement("#root");

export default function AdminNotification() {
  const storedAdmin = JSON.parse(localStorage.getItem("admin"));
  const adminId = storedAdmin?.adminId || "all";
  const navigate = useNavigate();
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    updateStatus,
    deleteNotification 
  } = useAdminNotification(adminId);
  
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isBulkSelect, setIsBulkSelect] = useState(false);
  const [fileManagementLink, setFileManagementLink] = useState("");

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
    setSelectedNotification(notification);
  };

  // When a notification is selected, navigate to file management
  useEffect(() => {
    if (selectedNotification) {
      // Navigate to file management with the file_id as a filter
      navigate(`/admin/file-management?search=${selectedNotification.file_id}`);
    }
  }, [selectedNotification, navigate]);

  const handleBulkSelect = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    if (window.confirm(`Delete ${selectedNotifications.length} notification(s)?`)) {
      try {
        for (const id of selectedNotifications) {
          await deleteNotification(id);
        }
        setSelectedNotifications([]);
        setIsBulkSelect(false);
      } catch (error) {
        console.error("Error bulk deleting:", error);
      }
    }
  };

  const handleMarkAsReviewed = async (notificationId) => {
    try {
      await updateStatus(notificationId, "reviewed");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleMarkAsArchived = async (notificationId) => {
    try {
      await updateStatus(notificationId, "archived");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleViewInFileManagement = (notification) => {
    // Navigate directly to file management with the specific file
    navigate(`/admin/file-management?search=${notification.file_id}&highlight=true`);
    if (!notification.is_read) {
      markAsRead(notification.notification_id);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending Review" },
      reviewed: { color: "bg-blue-100 text-blue-800", text: "Reviewed" },
      archived: { color: "bg-gray-100 text-gray-800", text: "Archived" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getDocumentTypeIcon = (documentType) => {
    switch(documentType) {
      case 'syllabus': return "📚";
      case 'tos-midterm': return "📝";
      case 'tos-final': return "📝";
      case 'midterm-exam': return "📄";
      case 'final-exam': return "📄";
      case 'instructional-materials': return "📖";
      default: return "📎";
    }
  };

  const getDocumentTypeText = (documentType) => {
    switch(documentType) {
      case 'syllabus': return 'Syllabus';
      case 'tos-midterm': return 'TOS (Midterm)';
      case 'tos-final': return 'TOS (Final)';
      case 'midterm-exam': return 'Midterm Exam';
      case 'final-exam': return 'Final Exam';
      case 'instructional-materials': return 'Instructional Materials';
      default: return documentType;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Notifications</h1>
            <p className="text-gray-600 mt-2">
              Monitor faculty file uploads and submissions
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Check size={18} />
                <span>Mark All as Read</span>
              </button>
            )}
            
            <div className="relative">
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center space-x-2">
                <span className="font-medium">Unread: </span>
                <span className="text-red-600 font-bold text-lg">{unreadCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {isBulkSelect && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="font-medium">
                {selectedNotifications.length} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 size={18} />
                <span>Delete Selected</span>
              </button>
            </div>
            <button
              onClick={() => {
                setIsBulkSelect(false);
                setSelectedNotifications([]);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Notifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notifications.length === 0 ? (
            <div className="col-span-full py-12 text-center">
              <div className="text-gray-400 mb-4">
                <FileText size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No notifications yet</h3>
              <p className="text-gray-500">
                Notifications will appear here when faculty upload files.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`bg-white rounded-xl shadow-md border ${
                  !notification.is_read ? 'border-l-4 border-l-yellow-500' : 'border-gray-200'
                } hover:shadow-lg transition-all duration-300 cursor-pointer`}
                onClick={() => handleViewInFileManagement(notification)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getDocumentTypeIcon(notification.document_type)}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <User size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {notification.faculty_name}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {isBulkSelect && (
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.notification_id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleBulkSelect(notification.notification_id);
                          }}
                          className="h-5 w-5 rounded border-gray-300"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      {!notification.is_read && (
                        <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {notification.message}
                  </p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <BookOpen size={16} className="mr-2" />
                      <span className="font-medium">{notification.subject_code}:</span>
                      <span className="ml-1 truncate">{notification.subject_title}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      <span>{notification.course} • {notification.semester} {notification.school_year}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">{getDocumentTypeText(notification.document_type)}</span>
                        {notification.tos_type && (
                          <span className="ml-1">({notification.tos_type})</span>
                        )}
                      </div>
                      {getStatusBadge(notification.status)}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewInFileManagement(notification);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <ExternalLink size={16} className="mr-1" />
                      View File
                    </button>
                    
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      {notification.status === "pending" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsReviewed(notification.notification_id);
                            }}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors flex items-center"
                            title="Mark as Reviewed"
                          >
                            <Check size={14} className="mr-1" />
                            Reviewed
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsArchived(notification.notification_id);
                            }}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center"
                            title="Archive"
                          >
                            <Archive size={14} className="mr-1" />
                            Archive
                          </button>
                        </>
                      )}
                      
                      {!isBulkSelect && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.notification_id);
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 mt-4">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bulk Select Toggle */}
        {notifications.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsBulkSelect(!isBulkSelect)}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isBulkSelect ? "Cancel Selection" : "Select Multiple"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}