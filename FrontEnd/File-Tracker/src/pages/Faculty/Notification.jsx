import useNotifications from "../../hooks/useNotification";

export default function NotificationPage() {
  const storedFaculty = JSON.parse(localStorage.getItem("faculty"));
  const currentUser = storedFaculty;

  const { notifications, markAsRead, loading } = useNotifications(currentUser);

  if (loading) return <div className="p-4">Loading notifications...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">All Notifications</h1>
      <div className="bg-white rounded-xl shadow-md divide-y">
        {notifications.length === 0 ? (
          <p className="p-4 text-gray-500">No notifications found.</p>
        ) : (
          notifications.map((note) => (
            <div
              key={note._id}
              onClick={() => markAsRead(note._id)}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                !note.read ? "bg-yellow-50" : ""
              }`}
            >
              <h2 className="font-semibold">{note.title}</h2>
              <p>{note.message}</p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(note.date).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
