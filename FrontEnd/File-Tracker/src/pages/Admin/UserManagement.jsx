import { useEffect, useState } from "react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/admin/user-management");
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const data = await res.json();
      console.log("✅ Fetched users:", data);
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Search filter (case-insensitive)
  const filteredUsers = users.filter((user) =>
    [user.user_id, user.name, user.number, user.role]
      .some((field) => field?.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-sm text-gray-500">
              A secure and organized system for managing user accounts, roles, and access
            </p>
          </div>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border border-gray-600">User ID</th>
                <th className="px-4 py-3 text-left border border-gray-600">Name</th>
                <th className="px-4 py-3 text-left border border-gray-600">Number</th>
                <th className="px-4 py-3 text-left border border-gray-600">Password</th>
                <th className="px-4 py-3 text-left border border-gray-600">Role</th>
                <th className="px-4 py-3 text-left border border-gray-600">Status</th>
                <th className="px-4 py-3 text-left border border-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 border border-gray-200">{user.user_id}</td>
                    <td className="px-4 py-2 border border-gray-200">{user.name}</td>
                    <td className="px-4 py-2 border border-gray-200">{user.number}</td>
                    <td className="px-4 py-2 border border-gray-200 font-mono text-xs">
                      ••••••••
                    </td>
                    <td className="px-4 py-2 border border-gray-200 capitalize">{user.role}</td>
                    <td className="px-4 py-2 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          user.status === "online" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                        }`}></div>
                        <span className={`font-medium capitalize ${
                          user.status === "online" ? "text-green-600" : "text-gray-500"
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 border border-gray-200 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500 font-medium">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentUsers.length > 0 ? (
            currentUsers.map((user) => (
              <div key={user.user_id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold text-gray-800">{user.name}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      user.status === "online" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    }`}></div>
                    <span className={`text-sm font-semibold capitalize ${
                      user.status === "online" ? "text-green-600" : "text-gray-500"
                    }`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600"><strong>ID:</strong> {user.user_id}</p>
                <p className="text-sm text-gray-600"><strong>Number:</strong> {user.number}</p>
                <p className="text-sm text-gray-600 font-mono"><strong>Password:</strong> ••••••••</p>
                <p className="text-sm text-gray-600 capitalize"><strong>Role:</strong> {user.role}</p>
                <p className="text-xs text-gray-500 mt-1"><strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No users found.</p>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center mt-6 gap-3">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
              currentPage === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-yellow-400 hover:text-black border-black"
            }`}
          >
            Previous
          </button>
          <span className="text-gray-600 text-sm">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
              currentPage === totalPages
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-yellow-400 hover:text-black border-black"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}