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
                <div className="flex-1">
                  <h2 className="font-semibold text-lg text-gray-800">{note.title}</h2>
                  <p className="text-gray-700 mt-1 whitespace-pre-line">{note.message}</p>
                  
                  {/* Show truncated notes preview */}
                  {note.message && note.message.includes("Notes:") && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-600">Notes Preview:</span>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                        {note.message.split("Notes:")[1]?.substring(0, 100)}
                        {note.message.split("Notes:")[1]?.length > 100 ? "..." : ""}
                      </p>
                    </div>
                  )}
                </div>
                {!note.is_read && (
                  <span className="inline-block w-3 h-3 bg-red-500 rounded-full ml-2 flex-shrink-0"></span>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  {new Date(note.created_at).toLocaleString()}
                </p>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {note.document_type === 'all-files' ? 'All Files' : note.document_type || "N/A"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for viewing notification details */}
      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onRequestClose={() => setSelectedNote(null)}
          className="bg-white rounded-xl shadow-xl p-6 max-w-lg mx-auto mt-20 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center overflow-y-auto"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">Admin Notice Details</h2>
            <button
              onClick={() => setSelectedNote(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-gray-700">Title:</span>
              <p className="text-gray-800 mt-1">{selectedNote.title}</p>
            </div>
            
            <div>
              <span className="font-semibold text-gray-700">Document Type:</span>
              <p className="text-gray-800 mt-1">
                {selectedNote.document_type === 'all-files' ? 'All Files' : selectedNote.document_type || "N/A"}
              </p>
            </div>
            
            <div>
              <span className="font-semibold text-gray-700">Due Date:</span>
              <p className={`font-medium mt-1 ${
                selectedNote.due_date && new Date(selectedNote.due_date) < new Date() 
                  ? "text-red-600" 
                  : "text-gray-800"
              }`}>
                {selectedNote.due_date
                  ? new Date(selectedNote.due_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : "No due date"}
              </p>
            </div>
            
            {/* Display notes if present in message */}
            {selectedNote.message && selectedNote.message.includes("Notes:") && (
              <div>
                <span className="font-semibold text-gray-700">Additional Notes:</span>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedNote.message.split("Notes:")[1]?.trim()}
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Notification Created: {new Date(selectedNote.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedNote(null)}
            className="mt-6 w-full bg-black text-white py-2 rounded-lg font-semibold hover:bg-yellow-500 hover:text-black transition duration-200"
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}