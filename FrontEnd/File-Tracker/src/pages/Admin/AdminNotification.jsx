import { useState, useEffect } from "react";
import useAdminNotification from "../../hooks/useAdminNotification";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

export default function AdminNotification() {
  const navigate = useNavigate();
  const { notifications, loading } = useAdminNotification();

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

  const handleNotificationClick = (notification) => {
    navigate(`/admin/file-management?search=${notification.file_id}`);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Notifications</h1>
          <p className="text-gray-600 mt-2">
            Monitor faculty file uploads and submissions
          </p>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-gray-400 mb-4">
                <FileText size={64} className="mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No notifications yet</h3>
              <p className="text-gray-500">
                Notifications will appear here when faculty upload files.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className="p-5 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="text-gray-800">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <FileText className="h-5 w-5 text-yellow-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-lg">
                          <span className="font-semibold text-gray-900">
                            {notification.faculty_name}
                          </span>
                          <span className="text-gray-700 ml-1">
                            uploaded a {getDocumentTypeText(notification.document_type)} file for {notification.subject_code}, {notification.semester} {notification.school_year}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}