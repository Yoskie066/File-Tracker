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
              <h2 className="font-semibold text-lg text-gray-800">{note.title}</h2>
              <p className="text-gray-700 mt-1">
                {note.document_type === "TOS" && note.tos_type 
                  ? `${note.message} (${note.tos_type})` 
                  : note.message}
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

      {/* Modal */}
      {selectedNote && (
        <Modal
          isOpen={!!selectedNote}
          onRequestClose={() => setSelectedNote(null)}
          className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-auto mt-20 outline-none"
          overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center overflow-y-auto"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">Admin Notice Details</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-semibold">Document Type:</span> {selectedNote.document_type === 'all-files' ? 'All Files' : selectedNote.document_type || "N/A"}
            </p>
            {selectedNote.document_type === 'TOS' && selectedNote.tos_type && selectedNote.tos_type !== "N/A" && (
              <p>
                <span className="font-semibold">TOS Type:</span> {selectedNote.tos_type}
              </p>
            )}
            <p>
              <span className="font-semibold">Due Date:</span>{" "}
              {selectedNote.due_date
                ? new Date(selectedNote.due_date).toLocaleDateString()
                : "No due date"}
            </p>
            
            {/* Display notes if available */}
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