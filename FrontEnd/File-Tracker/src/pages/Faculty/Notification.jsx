import { useState, useEffect } from "react";
import useNotification from "../../hooks/useNotification";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  BookOpen,
  ArrowRight,
  CheckCheck,
  AlertCircle
} from "lucide-react";

Modal.setAppElement("#root");

export default function NotificationPage() {
  const navigate = useNavigate();
  const storedFaculty = JSON.parse(localStorage.getItem("faculty"));
  const currentUser = storedFaculty;

  const { notifications, markAsRead, loading } = useNotification(currentUser);
  const [selectedNote, setSelectedNote] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, file_updates

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.is_read;
    if (filter === "file_updates") return notification.notification_type === "file_status_update";
    return true;
  });

  // Get status icon and color
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100' };
      default:
        return { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-100' };
    }
  };

  // Format notification time
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    setSelectedNote(notification);
  };

  // Navigate to Task Deliverables
  const navigateToTaskDeliverables = () => {
    if (selectedNote?.notification_type === "file_status_update") {
      navigate("/faculty/task-deliverables");
      setSelectedNote(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-600 mt-2">
            Stay updated with your file submissions and status changes
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all" 
                ? "bg-black text-white" 
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "unread" 
                ? "bg-black text-white" 
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Unread ({notifications.filter(n => !n.is_read).length})
          </button>
          <button
            onClick={() => setFilter("file_updates")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "file_updates" 
                ? "bg-black text-white" 
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            File Updates ({notifications.filter(n => n.notification_type === "file_status_update").length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 text-sm mt-2">
                {filter === "all" 
                  ? "You're all caught up!" 
                  : `No ${filter === "unread" ? "unread" : "file update"} notifications`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const StatusIcon = getStatusIcon(notification.new_status).icon;
              const iconColor = getStatusIcon(notification.new_status).color;
              const bgColor = getStatusIcon(notification.new_status).bgColor;

              return (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? "bg-yellow-50 border-l-4 border-yellow-400" : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${bgColor}`}>
                      {notification.notification_type === "file_status_update" ? (
                        <StatusIcon className={`w-5 h-5 ${iconColor}`} />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mt-1 text-sm">
                        {notification.message}
                      </p>
                      
                      {/* File Details */}
                      {notification.notification_type === "file_status_update" && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {notification.subject_code && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              {notification.subject_code}
                            </span>
                          )}
                          {notification.course && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                              {notification.course}
                            </span>
                          )}
                          {notification.document_type && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                              {notification.document_type}
                            </span>
                          )}
                          {notification.new_status && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                              notification.new_status === 'completed' ? 'bg-green-100 text-green-800' :
                              notification.new_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {notification.new_status}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Status Change */}
                      {notification.previous_status && notification.new_status && (
                        <div className="mt-2 flex items-center text-xs text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded mr-2">
                            {notification.previous_status}
                          </span>
                          <ArrowRight className="w-3 h-3 mx-1 text-gray-400" />
                          <span className={`px-2 py-1 rounded ${
                            notification.new_status === 'completed' ? 'bg-green-100 text-green-800' :
                            notification.new_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {notification.new_status}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notification Detail Modal */}
        {selectedNote && (
          <Modal
            isOpen={!!selectedNote}
            onRequestClose={() => setSelectedNote(null)}
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-auto mt-20 outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center overflow-y-auto p-4"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Notification Details</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTimeAgo(selectedNote.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className={`p-3 rounded-lg ${
                selectedNote.notification_type === "file_status_update" ? "bg-blue-50" : "bg-gray-50"
              }`}>
                <h3 className="font-semibold text-gray-800 text-lg">{selectedNote.title}</h3>
                <p className="text-gray-700 mt-2">{selectedNote.message}</p>
              </div>
              
              {/* File Status Update Details */}
              {selectedNote.notification_type === "file_status_update" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Document Type</p>
                      <p className="font-medium">{selectedNote.document_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">File Name</p>
                      <p className="font-medium truncate">{selectedNote.file_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Subject</p>
                      <p className="font-medium">{selectedNote.subject_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-medium">{selectedNote.course}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Status Change</p>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Previous</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                          selectedNote.previous_status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedNote.previous_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedNote.previous_status || 'N/A'}
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Current</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                          selectedNote.new_status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedNote.new_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedNote.new_status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">
                      This status update has been synced with your Task Deliverables.
                    </p>
                    <button
                      onClick={navigateToTaskDeliverables}
                      className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-black transition-all duration-300"
                    >
                      <BookOpen className="w-5 h-5" />
                      View in Task Deliverables
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => setSelectedNote(null)}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}