import { useState, useEffect } from "react";
import Modal from "react-modal";
import { CheckCircle, XCircle, MoreVertical, Search, Filter, ArrowUpDown, Trash2, Eye, RefreshCw } from "lucide-react";

// Set app element for react-modal
Modal.setAppElement("#root");

export default function Archive() {
  const [archives, setArchives] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionDropdown, setActionDropdown] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  // Filter states
  const [collectionFilter, setCollectionFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [sortOption, setSortOption] = useState("most_recent");

  // Feedback modal states
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("success");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null);

  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Collection options based on backend
  const collectionOptions = [
    { value: 'users', label: 'User Management' },
    { value: 'files', label: 'File Management' },
    { value: 'admin_notices', label: 'Admin Notice Management' },
    { value: 'system_variables', label: 'System Variables' }
  ];

  // Month options
  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch archives from backend
  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/archive`);
      if (!res.ok) throw new Error("Server responded with " + res.status);
      const result = await res.json();
      console.log("Fetched archives:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setArchives(result.data);
      } else {
        console.error("Unexpected API response format:", result);
        setArchives([]);
      }
    } catch (err) {
      console.error("Error fetching archives:", err);
      setArchives([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  // Close action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActionDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Get unique months from deleted_at for filter
  const getUniqueMonths = () => {
    const months = new Set();
    archives.forEach(archive => {
      if (archive.deleted_at) {
        const deletedDate = new Date(archive.deleted_at);
        const month = monthOptions[deletedDate.getMonth()];
        months.add(month);
      }
    });
    return Array.from(months).sort((a, b) => 
      monthOptions.indexOf(a) - monthOptions.indexOf(b)
    );
  };

  // Get unique years from deleted_at for filter
  const getUniqueYears = () => {
    const years = new Set();
    archives.forEach(archive => {
      if (archive.deleted_at) {
        const deletedDate = new Date(archive.deleted_at);
        const year = deletedDate.getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  // Reset all filters
  const resetFilters = () => {
    setCollectionFilter("");
    setMonthFilter("");
    setYearFilter("");
    setSortOption("most_recent");
    setCurrentPage(1);
  };

  // Show feedback modal
  const showFeedback = (type, message) => {
    setFeedbackType(type);
    setFeedbackMessage(message);
    setFeedbackModalOpen(true);
  };

  // Search and filter function
  const getFilteredArchives = () => {
    let filtered = (Array.isArray(archives) ? archives : []);

    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter((archive) => {
        return (
          (archive.name && archive.name.toLowerCase().includes(searchTerm)) ||
          (archive.type && archive.type.toLowerCase().includes(searchTerm)) ||
          (archive.description && archive.description.toLowerCase().includes(searchTerm)) ||
          (archive.collection_name && archive.collection_name.toLowerCase().includes(searchTerm)) ||
          (archive.deleted_by && archive.deleted_by.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Apply advanced filters
    if (collectionFilter) {
      const collectionLabel = collectionOptions.find(c => c.value === collectionFilter)?.label || collectionFilter;
      filtered = filtered.filter(a => a.source_module === collectionLabel);
    }
    
    if (monthFilter) {
      filtered = filtered.filter(a => {
        if (!a.deleted_at) return false;
        const deletedDate = new Date(a.deleted_at);
        const month = monthOptions[deletedDate.getMonth()];
        return month === monthFilter;
      });
    }
    
    if (yearFilter) {
      filtered = filtered.filter(a => {
        if (!a.deleted_at) return false;
        const deletedDate = new Date(a.deleted_at);
        const year = deletedDate.getFullYear();
        return year.toString() === yearFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.deleted_at);
      const dateB = new Date(b.deleted_at);
      
      switch (sortOption) {
        case "most_recent":
          return dateB - dateA;
        case "oldest":
          return dateA - dateB;
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  };

  const filteredArchives = getFilteredArchives();

  // Calculate stats for cards
  const calculateStats = (archivesList) => {
    if (!Array.isArray(archivesList) || archivesList.length === 0) {
      return { 
        total: 0,
        recentDeletions: 0,
        files: 0,
        users: 0,
        admin_notices: 0,
        system_variables: 0
      };
    }
  
    let filesCount = 0;
    let usersCount = 0;
    let adminNoticesCount = 0;
    let systemVariablesCount = 0;
    let recentDeletionsCount = 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    archivesList.forEach(archive => {
      switch (archive.collection_name) {
        case 'files':
          filesCount++;
          break;
        case 'users':
          usersCount++;
          break;
        case 'admin_notices':
          adminNoticesCount++;
          break;
        case 'system_variables':
          systemVariablesCount++;
          break;
      }
      
      // Count recent deletions (within last 30 days)
      if (archive.deleted_at) {
        const deletedDate = new Date(archive.deleted_at);
        if (deletedDate >= thirtyDaysAgo) {
          recentDeletionsCount++;
        }
      }
    });
  
    return {
      total: archivesList.length,
      recentDeletions: recentDeletionsCount,
      files: filesCount,
      users: usersCount,
      admin_notices: adminNoticesCount,
      system_variables: systemVariablesCount
    };
  };

  const archiveStats = calculateStats(filteredArchives);

  // Format date to show Month Day, Year, Time
  const formatDeletedDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date to show only Month and Year for display
  const formatDeletedMonthYear = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const month = monthOptions[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // Get badge color based on collection type
  const getCollectionBadgeColor = (collectionName) => {
    switch (collectionName) {
      case 'files':
        return 'bg-blue-100 text-blue-800';
      case 'users':
        return 'bg-green-100 text-green-800';
      case 'admin_notices':
        return 'bg-purple-100 text-purple-800';
      case 'system_variables':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get source module label
  const getSourceModuleLabel = (collectionName) => {
    const option = collectionOptions.find(c => c.value === collectionName);
    return option ? option.label : collectionName;
  };

  // View archive details
  const viewArchiveDetails = (archive) => {
    setSelectedArchive(archive);
    setDetailModalOpen(true);
  };

  // Pagination
  const totalPages = Math.ceil(filteredArchives.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentArchives = filteredArchives.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Handle delete archive
  const handleDelete = async (archiveId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/archive/${archiveId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchArchives();
        showFeedback("success", "Archive item permanently deleted!");
      } else {
        showFeedback("error", result.message || "Error deleting archive item");
      }
    } catch (error) {
      console.error("Error deleting archive item:", error);
      showFeedback("error", "Error deleting archive item");
    }
    setDeleteModalOpen(false);
    setArchiveToDelete(null);
    setActionDropdown(null);
  };

  // Open delete confirmation modal
  const confirmDelete = (archiveId) => {
    setArchiveToDelete(archiveId);
    setDeleteModalOpen(true);
  };

  // Render details based on collection type
  const renderArchiveDetails = () => {
    if (!selectedArchive) return null;

    const { collection_name, full_data, name, type, description, deleted_by, deleted_at } = selectedArchive;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archive ID</label>
            <p className="text-sm text-gray-900 font-mono">{selectedArchive.archive_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original ID</label>
            <p className="text-sm text-gray-900 font-mono">{selectedArchive.original_id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCollectionBadgeColor(collection_name)}`}>
              {getSourceModuleLabel(collection_name)}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <p className="text-sm text-gray-900">{type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deleted By</label>
            <p className="text-sm text-gray-900">{deleted_by}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deleted At</label>
            <p className="text-sm text-gray-900">{formatDeletedDate(deleted_at)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Data</label>
          <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(full_data, null, 2)}
            </pre>
          </div>
        </div>

        {description && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <p className="text-sm text-gray-900">{description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-xl p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Archive</h1>
            <p className="text-sm text-gray-500">
              View and manage deleted items from all modules
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search archive items..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Show Filters Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full md:w-auto"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Filtering and Sorting Options */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 w-full mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Collection
                  </label>
                  <select
                    value={collectionFilter}
                    onChange={(e) => {
                      setCollectionFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Collections</option>
                    {collectionOptions.map(collection => (
                      <option key={collection.value} value={collection.value}>
                        {collection.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    value={monthFilter}
                    onChange={(e) => {
                      setMonthFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Months</option>
                    {getUniqueMonths().map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <select
                    value={yearFilter}
                    onChange={(e) => {
                      setYearFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Years</option>
                    {getUniqueYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sort by:
                  </label>
                  <select
                    value={sortOption}
                    onChange={(e) => {
                      setSortOption(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="most_recent">Most Recent</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="col-span-1">
                  <span className="text-xs text-gray-500">
                    {filteredArchives.length} of {archives.length} archive items
                    {collectionFilter || monthFilter || yearFilter ? (
                      <span className="ml-2 text-blue-600">
                        ({[
                          collectionFilter && `Collection: ${collectionOptions.find(c => c.value === collectionFilter)?.label}`,
                          monthFilter && `Month: ${monthFilter}`,
                          yearFilter && `Year: ${yearFilter}`
                        ].filter(Boolean).join(", ")})
                      </span>
                    ) : null}
                  </span>
                </div>
                
                <div className="col-span-1">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-700">Sorted by: {sortOption === "most_recent" ? "Most Recent" : "Oldest"}</span>
                  </div>
                </div>
                
                <div className="col-span-1 text-right">
                  {(collectionFilter || monthFilter || yearFilter || sortOption !== "most_recent") && (
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-gray-600 text-sm font-medium">Total Archive</div>
            <div className="text-2xl font-bold text-gray-800">{archiveStats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-600 text-sm font-medium">Recent Deletions</div>
            <div className="text-2xl font-bold text-green-800">{archiveStats.recentDeletions}</div>
            <div className="text-xs text-green-500 mt-1">(Last 30 days)</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Files</div>
            <div className="text-2xl font-bold text-blue-800">{archiveStats.files}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Users</div>
            <div className="text-2xl font-bold text-purple-800">{archiveStats.users}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">System Variables</div>
            <div className="text-2xl font-bold text-yellow-800">{archiveStats.system_variables}</div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-black text-white uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left border-r border-gray-600">Collection</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Item Name</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Type</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Deleted By</th>
                <th className="px-4 py-3 text-left border-r border-gray-600">Deleted At</th>
                <th className="px-4 py-3 text-left border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentArchives.length > 0 ? (
                currentArchives.map((archive) => (
                  <tr key={archive.archive_id} className="hover:bg-gray-50 transition-colors border-b border-gray-200">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCollectionBadgeColor(archive.collection_name)}`}>
                        {getSourceModuleLabel(archive.collection_name)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{archive.name}</div>
                      {archive.description && (
                        <div className="text-xs text-gray-500 mt-1">{archive.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{archive.type}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{archive.deleted_by}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 text-sm">{formatDeletedDate(archive.deleted_at)}</div>
                      <div className="text-xs text-gray-500">{formatDeletedMonthYear(archive.deleted_at)}</div>
                    </td>
                    <td className="px-4 py-3 relative">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewArchiveDetails(archive)}
                          className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionDropdown(actionDropdown === archive.archive_id ? null : archive.archive_id);
                          }}
                          className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600"
                          title="More Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {actionDropdown === archive.archive_id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => confirmDelete(archive.archive_id)}
                            className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 font-medium">
                    {loading ? "Loading archive items..." : "No archive items found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden grid grid-cols-1 gap-4">
          {currentArchives.length > 0 ? (
            currentArchives.map((archive) => (
              <div key={archive.archive_id} className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCollectionBadgeColor(archive.collection_name)}`}>
                      {getSourceModuleLabel(archive.collection_name)}
                    </span>
                    <span className="text-xs text-gray-500">{archive.type}</span>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => viewArchiveDetails(archive)}
                        className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-600"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionDropdown(actionDropdown === archive.archive_id ? null : archive.archive_id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {actionDropdown === archive.archive_id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => confirmDelete(archive.archive_id)}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Permanently
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Item Name:</span>
                    <p className="font-medium">{archive.name}</p>
                    {archive.description && (
                      <p className="text-xs text-gray-500 mt-1">{archive.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Deleted By:</span>
                      <p className="font-medium">{archive.deleted_by}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <div className="text-gray-500 text-xs">Deleted At:</div>
                      <div className="font-medium text-xs">{formatDeletedDate(archive.deleted_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 font-medium">
              {loading ? "Loading archive items..." : "No archive items found"}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600">
            Showing {currentArchives.length} of {filteredArchives.length} archive items
            {yearFilter && ` from ${yearFilter}`}
            {collectionFilter && ` • Collection: ${collectionOptions.find(c => c.value === collectionFilter)?.label}`}
            {monthFilter && ` • Month: ${monthFilter}`}
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

        {/* Archive Details Modal */}
        <Modal
          isOpen={detailModalOpen}
          onRequestClose={() => setDetailModalOpen(false)}
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Archive Details
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {selectedArchive ? renderArchiveDetails() : (
              <div className="text-center py-8 text-gray-500">No details available</div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onRequestClose={() => setDeleteModalOpen(false)}
          className="bg-white p-6 rounded-xl max-w-sm mx-auto shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="flex flex-col items-center text-center">
            <XCircle className="text-red-500 w-12 h-12 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Permanent Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete this archive item? This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(archiveToDelete)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </Modal>

        {/* Feedback Modal */}
        <Modal
          isOpen={feedbackModalOpen}
          onRequestClose={() => setFeedbackModalOpen(false)}
          className="bg-white p-6 rounded-xl max-w-sm mx-auto shadow-lg"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="flex flex-col items-center text-center">
            {feedbackType === "success" ? (
              <CheckCircle className="text-green-500 w-12 h-12 mb-4" />
            ) : (
              <XCircle className="text-red-500 w-12 h-12 mb-4" />
            )}
            <p className="text-lg font-semibold text-gray-800 mb-2">{feedbackMessage}</p>
            <button
              onClick={() => setFeedbackModalOpen(false)}
              className="mt-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-300"
            >
              Close
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}