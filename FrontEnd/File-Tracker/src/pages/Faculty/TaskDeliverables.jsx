import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, FileText, Download, Upload } from "lucide-react";
import tokenService from "../../services/tokenService";

export default function TaskDeliverables() {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch task deliverables
  const fetchTaskDeliverables = async () => {
    try {
      setLoading(true);
      const token = tokenService.getFacultyAccessToken();
      
      if (!token) {
        console.error("No faculty token found");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/faculty/task-deliverables`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch task deliverables');

      const result = await response.json();
      
      if (result.success) {
        setDeliverables(result.data);
      }
    } catch (error) {
      console.error("Error fetching task deliverables:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDeliverables();
  }, []);

  // Get status badge color and icon
  const getStatusDetails = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Search filter
  const filteredDeliverables = deliverables.filter(deliverable =>
    [deliverable.subject_code, deliverable.course_section, deliverable.faculty_name]
      .some(field => field?.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredDeliverables.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDeliverables = filteredDeliverables.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Task Deliverables</h1>
            <p className="text-sm text-gray-500">
              Track and monitor all your teaching deliverables and their status
            </p>
          </div>
          <input
            type="text"
            placeholder="Search deliverables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Courses</div>
            <div className="text-2xl font-bold text-blue-800">{deliverables.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-green-800">
              {deliverables.filter(d => d.status === 'completed').length}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Pending</div>
            <div className="text-2xl font-bold text-yellow-800">
              {deliverables.filter(d => d.status === 'pending').length}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-red-600 text-sm font-medium">Rejected</div>
            <div className="text-2xl font-bold text-red-800">
              {deliverables.filter(d => d.status === 'rejected').length}
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Subject & Section</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Syllabus</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Midterm</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Final</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Midterm Exam</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Final Exam</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Instructional Materials</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">TOS Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Last Updated</th>
                <th className="px-4 py-3 text-left border-gray-600">Overall Status</th>
              </tr>
            </thead>
            <tbody>
              {currentDeliverables.length > 0 ? (
                currentDeliverables.map((deliverable) => {
                  const statusDetails = getStatusDetails(deliverable.status);
                  const StatusIcon = statusDetails.icon;
                  
                  return (
                    <tr key={deliverable._id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{deliverable.subject_code}</div>
                        <div className="text-xs text-gray-500">{deliverable.course_section}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDetails(deliverable.syllabus).color}`}>
                          {deliverable.syllabus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDetails(deliverable.tos_midterm).color}`}>
                          {deliverable.tos_midterm}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDetails(deliverable.tos_final).color}`}>
                          {deliverable.tos_final}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDetails(deliverable.midterm_exam).color}`}>
                          {deliverable.midterm_exam}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDetails(deliverable.final_exam).color}`}>
                          {deliverable.final_exam}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDetails(deliverable.instructional_materials).color}`}>
                          {deliverable.instructional_materials}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {deliverable.tos_type ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                            {deliverable.tos_type}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {formatDate(deliverable.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {deliverable.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500 font-medium">
                    {loading ? "Loading deliverables..." : "No deliverables found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentDeliverables.length > 0 ? (
            currentDeliverables.map((deliverable) => {
              const statusDetails = getStatusDetails(deliverable.status);
              const StatusIcon = statusDetails.icon;
              
              return (
                <div key={deliverable._id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="font-semibold text-gray-800">{deliverable.subject_code}</h2>
                      <p className="text-sm text-gray-600">{deliverable.course_section}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDetails.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {deliverable.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Syllabus:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusDetails(deliverable.syllabus).color}`}>
                        {deliverable.syllabus}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Midterm:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusDetails(deliverable.tos_midterm).color}`}>
                        {deliverable.tos_midterm}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Final:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusDetails(deliverable.tos_final).color}`}>
                        {deliverable.tos_final}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">TOS Type:</span>
                      <span className="ml-2 text-xs font-medium capitalize">
                        {deliverable.tos_type || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Midterm Exam:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusDetails(deliverable.midterm_exam).color}`}>
                        {deliverable.midterm_exam}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Final Exam:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusDetails(deliverable.final_exam).color}`}>
                        {deliverable.final_exam}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Instructional Materials:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusDetails(deliverable.instructional_materials).color}`}>
                        {deliverable.instructional_materials}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Updated: {formatDate(deliverable.updated_at)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading ? "Loading deliverables..." : "No deliverables found."}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentDeliverables.length} of {filteredDeliverables.length} deliverables
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