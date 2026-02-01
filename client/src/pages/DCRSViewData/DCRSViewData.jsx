import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import { DCRS_API_URL } from "../../config/api";
import SeasonalTable from "../../components/ViewData/SeasonalTable";
import AllSeasonTable from "../../components/ViewData/AllSeasonTable";
import RiceAdoptionRateTable from "../../components/ViewData/RiceAdoptionRateTable";
import ExportImportTable from "../../components/ViewData/ExportImportTable";
import CroppingIntensityTable from "../../components/ViewData/CroppingIntensityTable";
import DistrictWiseTable from "../../components/ViewData/DistrictWiseTable";
import FaostatTable from "../../components/ViewData/FaostatTable";
import EditModal from "../../components/ViewData/EditModal";
import AddDataModal from "../../components/ViewData/AddDataModal";
import Pagination from "../../components/ViewData/Pagination";

const ViewData = () => {
  const [selectedDataType, setSelectedDataType] = useState("");
  const [seasonalDataType, setSeasonalDataType] = useState("area");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // District-wise filters
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [districts, setDistricts] = useState([]);
  const [seasons, setSeasons] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(50);

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Add data modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({});

  const dataTypeOptions = [
    { value: "seasonal", label: "Seasonal Rice Data" },
    { value: "all-season", label: "All Season Data" },
    { value: "rice-adoption-rate", label: "Rice Adoption Rate Data" },
    { value: "district", label: "District-wise Rice Data" },
    { value: "export-import", label: "Rice Export-Import Data" },
    { value: "cropping-intensity", label: "Cropping Intensity Data" },
    { value: "faostat", label: "FAOStat Data" },
  ];

  const seasonalTypeOptions = [
    { value: "area", label: "Area (000' ha)" },
    { value: "production", label: "Production (000' MT)" },
    { value: "yield", label: "Yield (MT/ha)" },
  ];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDataType, seasonalDataType, selectedDistrict, selectedSeason]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (selectedDataType === "seasonal") {
      fetchSeasonalData();
    } else if (selectedDataType === "export-import") {
      fetchExportImportData();
    } else if (selectedDataType === "cropping-intensity") {
      fetchCroppingIntensityData();
    } else if (selectedDataType === "all-season") {
      fetchAllSeasonData();
    } else if (selectedDataType === "rice-adoption-rate") {
      fetchRiceAdoptionRateData();
    } else if (selectedDataType === "district") {
      fetchDistrictWiseFilters();
      fetchDistrictWiseData();
    } else if (selectedDataType === "faostat") {
      fetchFaostatData();
    }
  }, [selectedDataType, seasonalDataType, currentPage, selectedDistrict, selectedSeason]);

  // Helper function to safely format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = parseFloat(value);
    return isNaN(num) ? "-" : num.toFixed(2);
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditFormData({ ...record });
    setIsEditModalOpen(true);
  };

  // Handle delete button click
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
        const endpoints = {
          seasonal: `${DCRS_API_URL}/api/seasonal-data/${id}`,
          "export-import": `${DCRS_API_URL}/api/export-import/${id}`,
          "cropping-intensity": `${DCRS_API_URL}/api/cropping-intensity/${id}`,
          "all-season": `${DCRS_API_URL}/api/all-season-data/${id}`,
          "rice-adoption-rate": `${DCRS_API_URL}/api/rice-adoption-rate/${id}`,
          district: `${DCRS_API_URL}/api/district-wise/${id}`,
          faostat: `${DCRS_API_URL}/api/faostat-data/${id}`,
        };

        await axios.delete(endpoints[selectedDataType]);
        Swal.fire("Deleted!", "Record has been deleted.", "success");
        refreshData();
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

  // Handle update submit
  const handleUpdateSubmit = async () => {
    try {
      const endpoints = {
        seasonal: `${DCRS_API_URL}/api/seasonal-data/${editingRecord.id}`,
        "export-import": `${DCRS_API_URL}/api/export-import/${editingRecord.id}`,
        "cropping-intensity": `${DCRS_API_URL}/api/cropping-intensity/${editingRecord.id}`,
        "all-season": `${DCRS_API_URL}/api/all-season-data/${editingRecord.id}`,
        "rice-adoption-rate": `${DCRS_API_URL}/api/rice-adoption-rate/${editingRecord.id}`,
        district: `${DCRS_API_URL}/api/district-wise/${editingRecord.id}`,
        faostat: `${DCRS_API_URL}/api/faostat-data/${editingRecord.id}`,
      };

      await axios.put(endpoints[selectedDataType], editFormData);
      Swal.fire("Updated!", "Record has been updated.", "success");
      
      setIsEditModalOpen(false);
      setEditingRecord(null);
      setEditFormData({});
      refreshData();
    } catch (error) {
      console.error("Error updating record:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update record",
      });
    }
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
    setEditFormData({});
  };

  // Handle add data submit
  const handleAddDataSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoints = {
        seasonal: `${DCRS_API_URL}/api/seasonal-data`,
        "export-import": `${DCRS_API_URL}/api/export-import`,
        "cropping-intensity": `${DCRS_API_URL}/api/cropping-intensity`,
        "all-season": `${DCRS_API_URL}/api/all-season-data`,
        "rice-adoption-rate": `${DCRS_API_URL}/api/rice-adoption-rate`,
        district: `${DCRS_API_URL}/api/district-wise`,
        faostat: `${DCRS_API_URL}/api/faostat-data`,
      };

      // Prepare data based on type
      let dataToSend = { ...addFormData };
      
      // For seasonal data, add the dataType
      if (selectedDataType === "seasonal") {
        dataToSend.dataType = seasonalDataType;
      }

      await axios.post(endpoints[selectedDataType], dataToSend);
      Swal.fire("Success!", "Record has been added successfully.", "success");
      
      setIsAddModalOpen(false);
      setAddFormData({});
      refreshData();
    } catch (error) {
      console.error("Error adding record:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add record",
      });
    }
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddFormData({});
  };

  // Refresh data based on current data type
  const refreshData = () => {
    if (selectedDataType === "seasonal") fetchSeasonalData();
    else if (selectedDataType === "export-import") fetchExportImportData();
    else if (selectedDataType === "cropping-intensity") fetchCroppingIntensityData();
    else if (selectedDataType === "all-season") fetchAllSeasonData();
    else if (selectedDataType === "rice-adoption-rate") fetchRiceAdoptionRateData();
    else if (selectedDataType === "district") fetchDistrictWiseData();
    else if (selectedDataType === "faostat") fetchFaostatData();
  };

  const fetchSeasonalData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${DCRS_API_URL}/api/seasonal-data?dataType=${seasonalDataType}&page=${currentPage}&limit=${pageSize}`
      );
      
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.total);
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

  const fetchExportImportData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${DCRS_API_URL}/api/export-import?page=${currentPage}&limit=${pageSize}`
      );
      
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.total);
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

  const fetchCroppingIntensityData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${DCRS_API_URL}/api/cropping-intensity?page=${currentPage}&limit=${pageSize}`
      );
      
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.total);
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

  const fetchAllSeasonData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${DCRS_API_URL}/api/all-season-data?page=${currentPage}&limit=${pageSize}`
      );
      
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.total);
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

  const fetchRiceAdoptionRateData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${DCRS_API_URL}/api/rice-adoption-rate?page=${currentPage}&limit=${pageSize}`
      );
      
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.total);
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

  const fetchDistrictWiseFilters = async () => {
    try {
      const [districtResponse, seasonResponse] = await Promise.all([
        axios.get(`${DCRS_API_URL}/api/district-wise/districts`),
        axios.get(`${DCRS_API_URL}/api/district-wise/seasons`),
      ]);

      if (districtResponse.data.success) {
        setDistricts(districtResponse.data.data);
      }
      if (seasonResponse.data.success) {
        setSeasons(seasonResponse.data.data);
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const fetchDistrictWiseData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDistrict) params.append("district", selectedDistrict);
      if (selectedSeason) params.append("season", selectedSeason);
      params.append("page", currentPage);
      params.append("limit", pageSize);

      const url = `${DCRS_API_URL}/api/district-wise?${params.toString()}`;
      const response = await axios.get(url);
      
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.total);
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

  const fetchFaostatData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${DCRS_API_URL}/api/faostat-data?page=${currentPage}&limit=${pageSize}`
      );
      
      if (response.data.success) {
        setData(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalRecords(response.data.total);
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

  const renderTableSection = () => {
    const RefreshButton = ({ onClick, color = "green" }) => {
      const colorClasses = {
        green: "bg-green-600 hover:bg-green-700",
        blue: "bg-blue-600 hover:bg-blue-700",
        purple: "bg-purple-600 hover:bg-purple-700",
        teal: "bg-teal-600 hover:bg-teal-700",
        orange: "bg-orange-600 hover:bg-orange-700",
        indigo: "bg-indigo-600 hover:bg-indigo-700",
      };

      return (
        <button
          onClick={onClick}
          className={`px-3 sm:px-4 py-2 ${colorClasses[color]} text-white rounded-lg transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-initial justify-center`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Refresh</span>
        </button>
      );
    };

    const AddDataButton = ({ onClick, color = "green" }) => {
      const colorClasses = {
        green: "bg-green-600 hover:bg-green-700",
        blue: "bg-blue-600 hover:bg-blue-700",
        purple: "bg-purple-600 hover:bg-purple-700",
        teal: "bg-teal-600 hover:bg-teal-700",
        orange: "bg-orange-600 hover:bg-orange-700",
        indigo: "bg-indigo-600 hover:bg-indigo-700",
      };

      return (
        <button
          onClick={onClick}
          className={`px-3 sm:px-4 py-2 ${colorClasses[color]} text-white rounded-lg transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base flex-1 sm:flex-initial justify-center`}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="hidden sm:inline">Add Data</span>
          <span className="sm:hidden">Add</span>
        </button>
      );
    };

    if (loading) {
      return (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-8 sm:p-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-green-600 mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg">Loading data...</p>
        </div>
      );
    }

    const tables = {
      seasonal: {
        title: `Seasonal Rice Data - ${seasonalTypeOptions.find(opt => opt.value === seasonalDataType)?.label}`,
        component: <SeasonalTable data={data} formatNumber={formatNumber} onEdit={handleEdit} onDelete={handleDelete} />,
        color: "green",
      },
      "export-import": {
        title: "Rice Export-Import Data",
        component: <ExportImportTable data={data} formatNumber={formatNumber} onEdit={handleEdit} onDelete={handleDelete} />,
        color: "blue",
      },
      "cropping-intensity": {
        title: "Cropping Intensity Data",
        component: <CroppingIntensityTable data={data} formatNumber={formatNumber} onEdit={handleEdit} onDelete={handleDelete} />,
        color: "purple",
      },
      "all-season": {
        title: "All Season Data",
        component: <AllSeasonTable data={data} formatNumber={formatNumber} onEdit={handleEdit} onDelete={handleDelete} />,
        color: "teal",
      },
      "rice-adoption-rate": {
        title: "Rice Adoption Rate Data",
        component: <RiceAdoptionRateTable data={data} formatNumber={formatNumber} onEdit={handleEdit} onDelete={handleDelete} />,
        color: "orange",
      },
      district: {
        title: "District-Wise Rice Data",
        component: <DistrictWiseTable data={data} formatNumber={formatNumber} onEdit={handleEdit} onDelete={handleDelete} />,
        color: "indigo",
      },
      faostat: {
        title: "FAOStat Data",
        component: <FaostatTable data={data} onEdit={handleEdit} onDelete={handleDelete} loading={loading} />,
        color: "blue",
      },
    };

    const tableConfig = tables[selectedDataType];
    
    if (!tableConfig) {
      return (
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-8 sm:p-12 text-center">
          <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4">Select a data type to view the data</p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6"
      >
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 break-words pr-2">{tableConfig.title}</h2>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <AddDataButton onClick={() => setIsAddModalOpen(true)} color={tableConfig.color} />
            <RefreshButton onClick={refreshData} color={tableConfig.color} />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {tableConfig.component}
        </div>
        {data.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            View Data Repository
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Browse and analyze rice data from the BRRI database
          </p>
        </div>

        {/* Selection Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Select Data Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Data Type
              </label>
              <select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">-- Select Data Type --</option>
                {dataTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedDataType === "seasonal" && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Data Category
                </label>
                <select
                  value={seasonalDataType}
                  onChange={(e) => setSeasonalDataType(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  {seasonalTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedDataType === "district" && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Filter by District (Optional)
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">-- All Districts --</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Filter by Season (Optional)
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">-- All Seasons --</option>
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {selectedDataType && data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-3 sm:mt-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm sm:text-base">{data.length} records found</span>
            </motion.div>
          )}
        </motion.div>

        {/* Data Display */}
        {renderTableSection()}
      </motion.div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={closeModal}
        selectedDataType={selectedDataType}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        onSubmit={handleUpdateSubmit}
      />

      {/* Add Data Modal */}
      <AddDataModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        selectedDataType={selectedDataType}
        formData={addFormData}
        setFormData={setAddFormData}
        onSubmit={handleAddDataSubmit}
      />
    </div>
  );
};

export default ViewData;
