import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config/api";

const ViewData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(50);

  // Filters
  const [selectedDataType, setSelectedDataType] = useState("maximum-temp");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [stations, setStations] = useState([]);
  const [years, setYears] = useState([]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    station: "",
    year: "",
    month: "",
  });

  const dataTypeOptions = [
    { value: "maximum-temp", label: "Maximum Temperature (°C)" },
    { value: "minimum-temp", label: "Minimum Temperature (°C)" },
    { value: "rainfall", label: "Rainfall (mm)" },
    { value: "relative-humidity", label: "Relative Humidity (%)" },
    { value: "sunshine", label: "Sunshine (hrs)" },
    { value: "wind-speed", label: "Wind Speed (m/s)" },
    { value: "soil-moisture", label: "Soil Moisture (%)" },
    { value: "soil-temperature", label: "Soil Temperature (°C)" },
    { value: "average-temperature", label: "Average Temperature (°C)" },
    { value: "solar-radiation", label: "Solar Radiation (W/m²)" },
    { value: "evapo-transpiration", label: "Evapo Transpiration (mm)" },
  ];

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  useEffect(() => {
    fetchFilters();
  }, [selectedDataType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStation, selectedYear, selectedMonth, selectedDataType]);

  useEffect(() => {
    fetchData();
  }, [currentPage, selectedStation, selectedYear, selectedMonth, selectedDataType]);

  const fetchFilters = async () => {
    try {
      const [stationsRes, yearsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/${selectedDataType}/stations`),
        axios.get(`${API_BASE_URL}/${selectedDataType}/years`),
      ]);

      if (stationsRes.data.success) setStations(stationsRes.data.data);
      if (yearsRes.data.success) setYears(yearsRes.data.data);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", pageSize);
      if (selectedStation) params.append("station", selectedStation);
      if (selectedYear) params.append("year", selectedYear);
      if (selectedMonth) params.append("month", selectedMonth);

      const response = await axios.get(
        `${API_BASE_URL}/${selectedDataType}?${params.toString()}`
      );

      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to fetch data",
      });
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/${selectedDataType}/${id}`);
        Swal.fire("Deleted!", "Record has been deleted.", "success");
        fetchData();
      } catch (error) {
        console.error("Error deleting record:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to delete record",
        });
      }
    }
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const formData = { ...record };
    setEditFormData(formData);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
    setEditFormData({});
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value === "" ? null : parseFloat(value) || null,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/${selectedDataType}/${editingRecord.id}`,
        editFormData
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Record updated successfully!",
        });
        closeEditModal();
        fetchData();
      }
    } catch (error) {
      console.error("Error updating record:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update record",
      });
    }
  };

  const openAddModal = () => {
    setAddFormData({
      station: "",
      year: "",
      month: "",
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddFormData({
      station: "",
      year: "",
      month: "",
    });
  };

  const handleAddInputChange = (field, value) => {
    if (field === "station" || field === "year" || field === "month") {
      setAddFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setAddFormData((prev) => ({
        ...prev,
        [field]: value === "" ? null : parseFloat(value) || null,
      }));
    }
  };

  const checkDuplicateRecord = async (station, year, month) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/${selectedDataType}?station=${station}&year=${year}&month=${month}`
      );
      return response.data.data && response.data.data.length > 0;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    }
  };

  const handleSaveAdd = async () => {
    // Validate required fields
    if (!addFormData.station || !addFormData.year || !addFormData.month) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in Station, Year, and Month fields!",
      });
      return;
    }

    // Check for duplicate
    const isDuplicate = await checkDuplicateRecord(
      addFormData.station,
      addFormData.year,
      addFormData.month
    );

    if (isDuplicate) {
      Swal.fire({
        icon: "error",
        title: "Duplicate Record",
        text: `A record for ${addFormData.station} in ${months.find(m => m.value === addFormData.month)?.label} ${addFormData.year} already exists!`,
      });
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/${selectedDataType}`,
        addFormData
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Record added successfully!",
        });
        closeAddModal();
        fetchData();
      }
    } catch (error) {
      console.error("Error adding record:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add record",
      });
    }
  };

  const formatTemp = (value) => {
    if (value === null || value === undefined) return "-";
    return parseFloat(value).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-full mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {dataTypeOptions.find(dt => dt.value === selectedDataType)?.label || "Climate"} Data
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            View and manage {selectedDataType === 'rainfall' ? 'rainfall' : selectedDataType.replace('-', ' ')} records from weather stations
          </p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Filter Data
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Data Type
              </label>
              <select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dataTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Station
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- All Stations --</option>
                {stations.map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- All Years --</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- All Months --</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Data
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>

            {(selectedStation || selectedYear || selectedMonth) && (
              <button
                onClick={() => {
                  setSelectedStation("");
                  setSelectedYear("");
                  setSelectedMonth("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-700"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm sm:text-base">{totalRecords} records found</span>
            </motion.div>
          )}
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 text-base sm:text-lg">Loading data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 text-base sm:text-lg">No data available</p>
              <p className="text-gray-500 text-sm mt-2">
                Upload some data or adjust your filters
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
                      <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold border-b-2 border-r">
                        Station
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold border-b-2 border-r">
                        Year
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold border-b-2 border-r">
                        Month
                      </th>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <th
                          key={day}
                          className="px-1 sm:px-2 py-3 text-center text-[10px] sm:text-xs font-medium border-b-2 border-r"
                        >
                          {day}
                        </th>
                      ))}
                      <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold border-b-2">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className={`${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-800 border-b border-r">
                          {row.station}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center text-gray-700 border-b border-r">
                          {row.year}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-center text-gray-700 border-b border-r">
                          {months.find((m) => m.value === row.month.toString())?.label ||
                            row.month}
                        </td>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <td
                            key={day}
                            className="px-1 sm:px-2 py-2 text-[10px] sm:text-xs text-center text-gray-600 border-b border-r"
                          >
                            {formatTemp(row[`day${day}`])}
                          </td>
                        ))}
                        <td className="px-2 sm:px-4 py-2 text-center border-b">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(row)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}{" "}
                  records
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Page</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          setCurrentPage(page);
                        }
                      }}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-600">of {totalPages}</span>
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Edit Modal */}
        {isEditModalOpen && editingRecord && (
          <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="sticky top-0 bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
                <h2 className="text-xl sm:text-2xl font-bold">Edit Record</h2>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Station, Year, Month - Read Only */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Station
                    </label>
                    <input
                      type="text"
                      value={editFormData.station || ""}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="text"
                      value={editFormData.year || ""}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <input
                      type="text"
                      value={
                        months.find((m) => m.value === editFormData.month?.toString())
                          ?.label || editFormData.month
                      }
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Day Values - Editable */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Daily Values
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <div key={day}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Day {day}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editFormData[`day${day}`] ?? ""}
                          onChange={(e) =>
                            handleEditInputChange(`day${day}`, e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="-"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={closeEditModal}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="sticky top-0 bg-linear-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl z-10">
                <h2 className="text-xl sm:text-2xl font-bold">Add New Record</h2>
                <button
                  onClick={closeAddModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Station, Year, Month - Required Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Station <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addFormData.station || ""}
                      onChange={(e) => handleAddInputChange("station", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter station name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={addFormData.year || ""}
                      onChange={(e) => handleAddInputChange("year", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 2024"
                      min="1900"
                      max="2100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={addFormData.month || ""}
                      onChange={(e) => handleAddInputChange("month", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">-- Select Month --</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Day Values - Optional */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Daily Values (Optional)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <div key={day}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Day {day}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={addFormData[`day${day}`] ?? ""}
                          onChange={(e) =>
                            handleAddInputChange(`day${day}`, e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="-"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={closeAddModal}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAdd}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Record
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ViewData;
