import { useState } from "react";
import useNotification from "../../hooks/useNotification";
import Modal from "react-modal";

Modal.setAppElement("#root");

export default function NotificationPage() {
  const storedFaculty = JSON.parse(localStorage.getItem("faculty"));
  const currentUser = storedFaculty;

  const { notifications, markAsRead, loading } = useNotification(currentUser);
  const [selectedNote, setSelectedNote] = useState(null);

  if (loading) return <div className="p-4">Loading notifications...</div>;

  // Get document type display name
  const getDocumentTypeDisplay = (documentType, tosType) => {
    if (documentType === 'tos' && tosType) {
      return `TOS (${tosType === 'midterm' ? 'Midterm TOS' : 'Final TOS'})`;
    }
    
    const displayNames = {
      'syllabus': 'Syllabus',
      'tos': 'Table of Specification',
      'midterm-exam': 'Midterm Exam',
      'final-exam': 'Final Exam',
      'instructional-materials': 'Instructional Materials',
      'all-files': 'All Files'
    };
    
    return displayNames[documentType] || documentType;
  };

  // Format date to show only year-month-day
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Notifications:</h1>
      <div className="bg-white rounded-xl shadow-md divide-y">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">No notifications found.</p>
            <p className="text-gray-400 text-sm mt-2">
              Notifications will appear here when admin assigns.
            </p>
          </div>
        ) : (
          notifications.map((note) => (
            <div
              key={note._id}
              onClick={() => {
                markAsRead(note._id);
                setSelectedNote(note);
              }}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                !note.is_read ? "bg-yellow-50 border-l-4 border-yellow-400" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-lg text-gray-800">{note.title}</h2>
                  <p className="text-gray-700 mt-1">{note.message}</p>
                </div>
                {!note.is_read && (
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {note.document_type && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {getDocumentTypeDisplay(note.document_type, note.tos_type)}
                  </span>
                )}
                {note.due_date && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                    Due: {formatDate(note.due_date)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Notification Details Modal */}
      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onRequestClose={() => setSelectedNote(null)}
          className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-auto mt-20 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center overflow-y-auto"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">Admin Notice Details</h2>
          <div className="space-y-4 text-gray-700">
            {/* Faculty Name */}
            <div>
              <span className="font-semibold block mb-1">Faculty Name:</span>
              <p className="text-gray-800 p-2 bg-gray-50 rounded-md">
                {selectedNote.recipient_name}
              </p>
            </div>

            {/* Document Type */}
            <div>
              <span className="font-semibold block mb-1">Document Type:</span>
              <p className="text-gray-800 p-2 bg-gray-50 rounded-md">
                {getDocumentTypeDisplay(selectedNote.document_type, selectedNote.tos_type)}
              </p>
            </div>

            {/* TOS Type (if applicable) */}
            {selectedNote.document_type === 'tos' && selectedNote.tos_type && (
              <div>
                <span className="font-semibold block mb-1">TOS Type:</span>
                <p className="text-gray-800 p-2 bg-gray-50 rounded-md">
                  {selectedNote.tos_type === 'midterm' ? 'TOS-Midterm' : 'TOS-Final'}
                </p>
              </div>
            )}

            {/* Due Date */}
            <div>
              <span className="font-semibold block mb-1">Due Date:</span>
              <p className={`text-gray-800 p-2 rounded-md ${
                new Date(selectedNote.due_date) < new Date() 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {formatDate(selectedNote.due_date)}
                {new Date(selectedNote.due_date) < new Date() && (
                  <span className="ml-2 text-xs font-semibold">(OVERDUE)</span>
                )}
              </p>
            </div>

            {/* Instructions/Notes */}
            {selectedNote.notes && selectedNote.notes.trim() !== "" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="font-semibold block mb-2">Instructions/Notes:</span>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md text-sm">
                  {selectedNote.notes}
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-3">
              Created: {new Date(selectedNote.created_at).toLocaleString()}
            </p>
          </div>

          <button
            onClick={() => setSelectedNote(null)}
            className="mt-6 w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-yellow-500 hover:text-black transition"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}