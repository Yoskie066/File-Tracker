import { useState } from "react";
import useAdminNotification from "../../hooks/useAdminNotification";
import { useNavigate } from "react-router-dom";

export default function AdminNotification() {
  const storedAdmin = JSON.parse(localStorage.getItem("admin"));
  const currentUser = storedAdmin;
  const navigate = useNavigate();
  
  const { notifications, markAsRead, loading, unreadCount } = useAdminNotification();
  const [selectedNote, setSelectedNote] = useState(null);

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

  if (loading) return <div className="p-4">Loading notifications...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Notifications:</h1>
      <div className="bg-white rounded-xl shadow-md divide-y">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No notifications found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Notifications will appear here when faculty upload files.
            </p>
          </div>
        ) : (
          notifications.map((note) => (
            <div
              key={note._id}
              onClick={() => {
                markAsRead(note._id);
                navigate(`/admin/file-management?search=${note.file_id}`);
              }}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                !note.is_read ? "bg-yellow-50 border-l-4 border-yellow-400" : ""
              }`}
            >
              <h2 className="font-semibold text-lg text-gray-800">
                {note.faculty_name} uploaded a {getDocumentTypeText(note.document_type)} file
              </h2>
              <p className="text-gray-700 mt-1">
                for {note.subject_code}, {note.semester} {note.school_year}
              </p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  {new Date(note.created_at).toLocaleString()}
                </p>
                {!note.is_read && (
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}