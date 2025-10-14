import { useEffect, useState } from "react";
import { Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

  // Calculate stats for charts
  const userStats = {
    total: users.length,
    online: users.filter(user => user.status === 'online').length,
    offline: users.filter(user => user.status === 'offline').length,
    admin: users.filter(user => user.role === 'admin').length,
    faculty: users.filter(user => user.role === 'faculty').length
  };

  // Chart data for user distribution
  const roleChartData = {
    labels: ['Admin', 'Faculty'],
    datasets: [
      {
        data: [userStats.admin, userStats.faculty],
        backgroundColor: ['#4F46E5', '#10B981'],
        borderColor: ['#4F46E5', '#10B981'],
        borderWidth: 2,
      },
    ],
  };

  const statusChartData = {
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [userStats.online, userStats.offline],
        backgroundColor: ['#10B981', '#6B7280'],
        borderColor: ['#10B981', '#6B7280'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

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
    <div className="min-h-screen bg-white p-4 md:p-8">
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
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Users</div>
            <div className="text-2xl font-bold text-blue-800">{userStats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Online</div>
            <div className="text-2xl font-bold text-green-800">{userStats.online}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-gray-600 text-sm font-medium">Offline</div>
            <div className="text-2xl font-bold text-gray-800">{userStats.offline}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Active Rate</div>
            <div className="text-2xl font-bold text-purple-800">
              {userStats.total > 0 ? Math.round((userStats.online / userStats.total) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Distribution by Role</h3>
            <div className="h-64">
              <Doughnut data={roleChartData} options={chartOptions} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Status Overview</h3>
            <div className="h-64">
              <Doughnut data={statusChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">User ID</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Number</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Password</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Role</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Status</th>
                <th className="px-4 py-3 text-left border-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3 font-mono text-xs">{user.user_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-700">{user.number}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                        ••••••••
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          user.status === "online" ? "bg-green-500" : "bg-gray-400"
                        }`}></div>
                        <span className={`font-medium capitalize ${
                          user.status === "online" ? "text-green-600" : "text-gray-500"
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 font-medium">
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
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-800">{user.name}</h2>
                    <p className="text-sm text-gray-600 font-mono">{user.user_id}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Number:</span>
                    <p className="font-medium">{user.number}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        user.status === "online" ? "bg-green-500" : "bg-gray-400"
                      }`}></div>
                      <span className={`font-medium capitalize ${
                        user.status === "online" ? "text-green-600" : "text-gray-500"
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="text-gray-500">Password:</span>
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded ml-2">
                    ••••••••
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              No users found.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentUsers.length} of {filteredUsers.length} users
          </div>
          
          <div className="flex items-center gap-3">
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
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-yellow-400 hover:text-black border-black"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}