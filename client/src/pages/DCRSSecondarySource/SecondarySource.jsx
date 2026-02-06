import React, { useState } from "react";
import { motion } from "framer-motion";
import SeasonalRiceChart from "./SeasonalRiceChart";
import ExportImportChart from "./ExportImportChart";
import CroppingIntensityChart from "./CroppingIntensityChart";
import DistrictWiseChart from "./DistrictWiseChart";
import VarietalRiceChart from "./VarietalRiceChart";
import RiceAdoptionRateChart from "./RiceAdoptionRateChart";
import FaostatChart from "./charts/FaostatChart";
import SeasonalRiceModal from "./Modals/SeasonalRiceModal";
import DistrictWiseModal from "./Modals/DistrictWiseModal";
import VarietalRiceModal from "./Modals/VarietalRiceModal";
import RiceAdoptionRateModal from "./Modals/RiceAdoptionRateModal";
import RequestDataModal from "./Modals/RequestDataModal";
import CroppingIntensityModal from "./Modals/CroppingIntensityModal";

const SecondarySource = () => {
  const [selectedDataSource, setSelectedDataSource] = useState("seasonal-rice");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isSeasonalModalOpen, setIsSeasonalModalOpen] = useState(false);
  const [isVarietalModalOpen, setIsVarietalModalOpen] = useState(false);
  const [isAdoptionModalOpen, setIsAdoptionModalOpen] = useState(false);
  const [isCroppingModalOpen, setIsCroppingModalOpen] = useState(false);
  const [showGraphs, setShowGraphs] = useState(true);
  
  const [districtFilter, setDistrictFilter] = useState({
    selectedDistricts: [],
    selectedSeason: "",
  });
  const [seasonalFilter, setSeasonalFilter] = useState({
    selectedSeason: "Boro",
  });
  const [varietalFilter, setVarietalFilter] = useState({
    selectedVarieties: [],
    selectedSeason: "",
  });
  const [adoptionFilter, setAdoptionFilter] = useState({
    selectedVarieties: [],
    selectedSeason: "",
  });
  const [croppingFilter, setCroppingFilter] = useState({
    selectedDataType: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    organization: "",
    address: "",
    email: "",
    mobile: "",
    purpose: "",
  });

  // Bangladesh 64 Districts
  const bangladeshDistricts = [
    "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria",
    "Chandpur", "Chapai Nawabganj", "Chittagong", "Chuadanga", "Comilla", "Cox's Bazar",
    "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
    "Habiganj", "Jamalpur", "Jessore", "Jhalokati", "Jhenaidah", "Joypurhat",
    "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
    "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar",
    "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi",
    "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
    "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
    "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
    "Tangail", "Thakurgaon"
  ];

  // Rice Seasons
  const riceSeasons = ["Aus", "Aman", "Boro"];

  // Data source options
  const dataSourceOptions = [
    {
      id: "seasonal-rice",
      title: "Seasonal Rice Area, Production and Yield",
      icon: (
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      description: "Aman, Aus, Boro seasonal data analysis",
    },
    {
      id: "varietal-rice",
      title: "Varietal Rice Area, Production and Yield",
      icon: (
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
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      ),
      description: "HYV, Local, and Hybrid varieties data",
    },
    {
      id: "district-wise",
      title: "District Wise Rice Area, Production and Yield",
      icon: (
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
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
      description: "Regional distribution and statistics",
    },
    {
      id: "adoption-rate",
      title: "Rice Adoption Rate",
      icon: (
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
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      description: "Variety adoption trends over time",
    },
    {
      id: "export-import",
      title: "Rice Export and Import",
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      description: "International trade statistics",
    },
    {
      id: "cropping-intensity",
      title: "Cropping Intensity",
      icon: (
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
            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      description: "Land use efficiency metrics",
    },
    {
      id: "faostat",
      title: "Emissions CH4",
      icon: (
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      description: "Global rice statistics from FAO",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle data source change
  const handleDataSourceChange = (e) => {
    const value = e.target.value;
    
    // If empty value selected, just reset
    if (value === "") {
      setSelectedDataSource("");
      setShowGraphs(false);
      return;
    }
    
    // Reset all modal states
    setShowGraphs(false);
    setIsDistrictModalOpen(false);
    setIsSeasonalModalOpen(false);
    setIsVarietalModalOpen(false);
    setIsAdoptionModalOpen(false);
    setIsCroppingModalOpen(false);
    
    // Reset all filter states to allow reselection
    setDistrictFilter({
      selectedDistricts: [],
      selectedSeason: "",
    });
    setSeasonalFilter({
      selectedSeason: "",
    });
    setVarietalFilter({
      selectedVarieties: [],
      selectedSeason: "",
    });
    setAdoptionFilter({
      selectedVarieties: [],
      selectedSeason: "",
    });
    setCroppingFilter({
      selectedDataType: "",
    });
    
    // Open specific modal based on data source
    if (value === "district-wise") {
      setIsDistrictModalOpen(true);
    } else if (value === "seasonal-rice") {
      setIsSeasonalModalOpen(true);
    } else if (value === "varietal-rice") {
      setIsVarietalModalOpen(true);
    } else if (value === "adoption-rate") {
      setIsAdoptionModalOpen(true);
    } else if (value === "cropping-intensity") {
      setIsCroppingModalOpen(true);
    } else if (value === "faostat" || value === "export-import") {
      // For FAOStat and export-import, show graphs directly without modal
      setShowGraphs(true);
    } else {
      // For other data sources, show graphs directly
      setShowGraphs(true);
    }
    
    // Set the selected data source (this allows onChange to trigger again)
    setSelectedDataSource(value);
  };

  // Modal submit handlers
  const handleDistrictSubmit = () => {
    setIsDistrictModalOpen(false);
    setShowGraphs(true);
  };

  const handleSeasonalSubmit = () => {
    setIsSeasonalModalOpen(false);
    setShowGraphs(true);
  };

  const handleVarietalSubmit = () => {
    setIsVarietalModalOpen(false);
    setShowGraphs(true);
  };

  const handleAdoptionSubmit = () => {
    setIsAdoptionModalOpen(false);
    setShowGraphs(true);
  };

  const handleCroppingSubmit = () => {
    setIsCroppingModalOpen(false);
    setShowGraphs(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="text-center py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 px-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Rice Data
            </motion.h1>
            <motion.p
              className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Access comprehensive rice statistics and agricultural data from
              official sources
            </motion.p>
            <motion.div
              className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 px-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <motion.span
                className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-blue-100 text-blue-700 rounded-full text-[10px] sm:text-xs md:text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                BBS Data
              </motion.span>
              <motion.span
                className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-green-100 text-green-700 rounded-full text-[10px] sm:text-xs md:text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.1 }}
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                    clipRule="evenodd"
                  />
                </svg>
                DAE Reports
              </motion.span>
              <motion.span
                className="inline-flex items-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-purple-100 text-purple-700 rounded-full text-[10px] sm:text-xs md:text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ delay: 0.2 }}
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                BRRI Research
              </motion.span>
            </motion.div>
          </motion.div>
        </div>

        {/* Data Source Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 md:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg">
                    Select Data Source
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Choose a data category to view and analyze
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => setIsModalOpen(true)}
                className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg text-xs sm:text-sm md:text-base font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center gap-1.5 sm:gap-2 whitespace-nowrap w-full sm:w-auto justify-center"
                whileHover={{
                  scale: 1.02,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                whileTap={{ scale: 0.98 }}
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Request Data
              </motion.button>
            </div>

            {/* Dropdown */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <select
                  value={selectedDataSource}
                  onChange={handleDataSourceChange}
                  onFocus={(e) => {
                    // Reset to empty on focus to allow reselection of same option
                    if (e.target.value !== "") {
                      setSelectedDataSource("");
                      setShowGraphs(false);
                    }
                  }}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 md:py-4 border-2 border-gray-200 rounded-xl bg-linear-to-r from-gray-50 to-white hover:from-white hover:to-gray-50 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-gray-700 text-sm sm:text-base font-medium cursor-pointer appearance-none shadow-sm hover:shadow-md focus:shadow-lg"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%233B82F6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 1rem center",
                    backgroundSize: "1.25em 1.25em",
                  }}
                >
                  <option value="">Select a data source...</option>
                  {dataSourceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content Area - Rice Statistics Graphs */}
        {showGraphs && selectedDataSource && (
          <div className="space-y-4 sm:space-y-6">
            {/* Seasonal Rice Data */}
            {selectedDataSource === "seasonal-rice" && (
              <SeasonalRiceChart selectedSeason={seasonalFilter.selectedSeason} />
            )}

            {/* Export-Import Data */}
            {selectedDataSource === "export-import" && (
              <ExportImportChart />
            )}

            {/* Cropping Intensity Data */}
            {selectedDataSource === "cropping-intensity" && (
              <CroppingIntensityChart selectedDataType={croppingFilter.selectedDataType} />
            )}

            {/* District Wise Data */}
            {selectedDataSource === "district-wise" && (
              <DistrictWiseChart 
                selectedDistricts={districtFilter.selectedDistricts} 
                selectedSeason={districtFilter.selectedSeason}
              />
            )}

            {/* Varietal Rice Data */}
            {selectedDataSource === "varietal-rice" && (
              <VarietalRiceChart 
                selectedSeason={varietalFilter.selectedSeason}
                selectedVarieties={varietalFilter.selectedVarieties}
              />
            )}

            {/* Rice Adoption Rate Data */}
            {selectedDataSource === "adoption-rate" && (
              <RiceAdoptionRateChart 
                selectedSeason={adoptionFilter.selectedSeason}
                selectedVarieties={adoptionFilter.selectedVarieties}
              />
            )}

            {/* FAOStat Data */}
            {selectedDataSource === "faostat" && (
              <FaostatChart />
            )}
          </div>
        )}

        {/* Empty State - No data source selected */}
        {!selectedDataSource && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="text-center py-8 sm:py-10 md:py-12">
              <div className="text-gray-300 mb-3 sm:mb-4 flex justify-center">
                <svg
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 mb-2 px-4">
                Select a Data Source
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-md mx-auto px-4">
                Choose a data category from the dropdown above to view
                comprehensive statistics and analysis
              </p>
            </div>
          </div>
        )}

        {/* Modals */}
        <SeasonalRiceModal
          isOpen={isSeasonalModalOpen}
          onClose={() => {
            setIsSeasonalModalOpen(false);
            setSelectedDataSource("");
          }}
          seasonalFilter={seasonalFilter}
          setSeasonalFilter={setSeasonalFilter}
          onSubmit={handleSeasonalSubmit}
        />

        <DistrictWiseModal
          isOpen={isDistrictModalOpen}
          onClose={() => {
            setIsDistrictModalOpen(false);
            setSelectedDataSource("");
          }}
          districtFilter={districtFilter}
          setDistrictFilter={setDistrictFilter}
          onSubmit={handleDistrictSubmit}
          bangladeshDistricts={bangladeshDistricts}
          riceSeasons={riceSeasons}
        />

        <VarietalRiceModal
          isOpen={isVarietalModalOpen}
          onClose={() => {
            setIsVarietalModalOpen(false);
            setSelectedDataSource("");
          }}
          varietalFilter={varietalFilter}
          setVarietalFilter={setVarietalFilter}
          onSubmit={handleVarietalSubmit}
        />

        <RiceAdoptionRateModal
          isOpen={isAdoptionModalOpen}
          onClose={() => {
            setIsAdoptionModalOpen(false);
            setSelectedDataSource("");
          }}
          adoptionFilter={adoptionFilter}
          setAdoptionFilter={setAdoptionFilter}
          onSubmit={handleAdoptionSubmit}
        />

        <CroppingIntensityModal
          isOpen={isCroppingModalOpen}
          onClose={() => {
            setIsCroppingModalOpen(false);
            setSelectedDataSource("");
          }}
          croppingFilter={croppingFilter}
          setCroppingFilter={setCroppingFilter}
          onSubmit={handleCroppingSubmit}
        />

        <RequestDataModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          formData={formData}
          setFormData={setFormData}
          dataSourceOptions={dataSourceOptions}
          bangladeshDistricts={bangladeshDistricts}
          riceSeasons={riceSeasons}
        />
      </div>
    </div>
  );
};

export default SecondarySource;
