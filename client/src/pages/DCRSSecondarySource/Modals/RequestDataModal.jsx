import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { DCRS_API_URL } from "../../../config/api";
import { useAuthContext } from "../../../components/context/AuthProvider";

const RequestDataModal = ({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData,
  dataSourceOptions,
  bangladeshDistricts,
  riceSeasons
}) => {
  const { authUser } = useAuthContext();

  // Local state for new features
  const [selectedDataSources, setSelectedDataSources] = useState([]);
  const [timeInterval, setTimeInterval] = useState("10Y");
  const [dataAverage, setDataAverage] = useState(null);
  const [downloadFormats, setDownloadFormats] = useState({
    csv: false,
    image: false
  });
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);
  
  // Custom year range state
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [fromYear, setFromYear] = useState(1971);
  const [toYear, setToYear] = useState(new Date().getFullYear());
  
  // Generate available years (1971 to current year)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: currentYear - 1970 }, (_, i) => 1971 + i);

  // Data source specific filters
  const [dataSourceFilters, setDataSourceFilters] = useState({
    "seasonal-rice": { selectedSeason: "" },
    "varietal-rice": { selectedSeason: "", selectedVarieties: [] },
    "district-wise": { selectedDistricts: [], selectedSeason: "" },
    "adoption-rate": { selectedSeason: "", selectedVarieties: [] },
    "cropping-intensity": { selectedDataType: "" }
  });

  const timeIntervals = ["1Y", "5Y", "10Y", "20Y", "30Y", "50Y", "All"];
  const dataAverages = ["1Y", "5Y", "10Y", "20Y", "30Y", "50Y"];
  const riceVarieties = ["MV", "LV"];
  const croppingDataTypes = ["Cropping Intensity", "Cropped Area"];
  
  // All unique BRRI rice varieties for adoption rate
  const adoptionRateVarieties = [
    "BR1", "BR2", "BR3", "BR4", "BR5", "BR7", "BR8", "BR9", "BR10", "BR11", "BR12", 
    "BR14", "BR15", "BR16", "BR17", "BR18", "BR19", "BR20", "BR21", "BR22", "BR23", 
    "BR24", "BR25", "BR26",
    "BRRI dhan27", "BRRI dhan28", "BRRI dhan29", "BRRI dhan30", "BRRI dhan31", 
    "BRRI dhan32", "BRRI dhan33", "BRRI dhan34", "BRRI dhan36", "BRRI dhan37", 
    "BRRI dhan39", "BRRI dhan40", "BRRI dhan41", "BRRI dhan42", "BRRI dhan43", 
    "BRRI dhan44", "BRRI dhan45", "BRRI dhan46", "BRRI dhan47", "BRRI dhan48", 
    "BRRI dhan49", "BRRI dhan50", "BRRI dhan51", "BRRI dhan52", "BRRI dhan53", 
    "BRRI dhan54", "BRRI dhan55", "BRRI dhan56", "BRRI dhan57", "BRRI dhan58", 
    "BRRI dhan59", "BRRI dhan60", "BRRI dhan61", "BRRI dhan62", "BRRI dhan63", 
    "BRRI dhan64", "BRRI dhan65", "BRRI dhan66", "BRRI dhan67", "BRRI dhan68", 
    "BRRI dhan69", "BRRI dhan70", "BRRI dhan71", "BRRI dhan72", "BRRI dhan73", 
    "BRRI dhan74", "BRRI dhan75", "BRRI dhan76", "BRRI dhan77", "BRRI dhan78", 
    "BRRI dhan79", "BRRI dhan80", "BRRI dhan81", "BRRI dhan82", "BRRI dhan83", 
    "BRRI dhan84", "BRRI dhan85", "BRRI dhan86", "BRRI dhan87", "BRRI dhan88", 
    "BRRI dhan89", "BRRI dhan90", "BRRI dhan91", "BRRI dhan92", "BRRI dhan93", 
    "BRRI dhan94", "BRRI dhan95", "BRRI dhan96", "BRRI dhan97", "BRRI dhan98", 
    "BRRI dhan99", "BRRI dhan100", "BRRI dhan101", "BRRI dhan102", "BRRI dhan103", 
    "BRRI dhan104", "BRRI dhan105", "BRRI dhan106", "BRRI dhan107", "BRRI dhan108",
    "BRRI hybrid dhan1", "BRRI hybrid dhan2", "BRRI hybrid dhan3", "BRRI hybrid dhan4", 
    "BRRI hybrid dhan5", "BRRI hybrid dhan6", "BRRI hybrid dhan7", "BRRI hybrid dhan8",
    "Others BRRI Varieties",
    "All BRRI Varieties"
  ];

  // Pre-fill user data from profile
  useEffect(() => {
    if (authUser && isOpen) {
      setFormData(prev => ({
        ...prev,
        name: authUser.name || "",
        designation: authUser.designation || "",
        organization: authUser.organization || "",
        address: authUser.address || "",
        email: authUser.email || "",
        mobile: authUser.mobileNumber || "",
      }));
    }
  }, [authUser, isOpen]);

  const isFieldAutoFilled = (fieldName) => {
    const mapping = { name: 'name', designation: 'designation', organization: 'organization', address: 'address', email: 'email', mobile: 'mobileNumber' };
    return authUser && !!authUser[mapping[fieldName]];
  };

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDataSource = (sourceId) => {
    setSelectedDataSources(prev => {
      if (prev.includes(sourceId)) {
        // Remove data source and its filters
        return prev.filter(id => id !== sourceId);
      } else {
        // Add data source
        return [...prev, sourceId];
      }
    });
  };

  const updateDataSourceFilter = (sourceId, filterKey, value) => {
    setDataSourceFilters(prev => ({
      ...prev,
      [sourceId]: {
        ...prev[sourceId],
        [filterKey]: value
      }
    }));
  };

  const toggleArrayFilter = (sourceId, filterKey, item) => {
    setDataSourceFilters(prev => {
      const currentArray = prev[sourceId]?.[filterKey] || [];
      let newArray;
      
      if (currentArray.includes(item)) {
        newArray = currentArray.filter(i => i !== item);
      } else {
        newArray = [...currentArray, item];
      }
      
      // Sort varieties to ensure MV always comes before LV for consistent color assignment
      if (filterKey === 'selectedVarieties' && (sourceId === 'varietal-rice' || sourceId === 'adoption-rate')) {
        const varietyOrder = { 'MV': 0, 'LV': 1 };
        newArray = newArray.sort((a, b) => {
          const orderA = varietyOrder[a] !== undefined ? varietyOrder[a] : 999;
          const orderB = varietyOrder[b] !== undefined ? varietyOrder[b] : 999;
          return orderA - orderB;
        });
      }
      
      return {
        ...prev,
        [sourceId]: {
          ...prev[sourceId],
          [filterKey]: newArray
        }
      };
    });
  };

  const toggleDownloadFormat = (format) => {
    setDownloadFormats(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (selectedDataSources.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Data Source Selected",
        text: "Please select at least one data source.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    // Validate filters for each selected data source
    for (const sourceId of selectedDataSources) {
      const filters = dataSourceFilters[sourceId];
      
      if (sourceId === "seasonal-rice" && !filters?.selectedSeason) {
        Swal.fire({
          icon: "warning",
          title: "Season Not Selected",
          text: "Please select a season for Seasonal Rice data.",
          confirmButtonColor: "#f59e0b",
        });
        return;
      }
      
      if (sourceId === "varietal-rice") {
        if (!filters?.selectedSeason) {
          Swal.fire({
            icon: "warning",
            title: "Season Not Selected",
            text: "Please select a season for Varietal Rice data.",
            confirmButtonColor: "#f59e0b",
          });
          return;
        }
        if (filters.selectedSeason !== "B. Aman" && (!filters?.selectedVarieties || filters.selectedVarieties.length === 0)) {
          Swal.fire({
            icon: "warning",
            title: "Variety Not Selected",
            text: "Please select at least one variety (MV or LV) for Varietal Rice data.",
            confirmButtonColor: "#f59e0b",
          });
          return;
        }
      }
      
      if (sourceId === "district-wise") {
        if (!filters?.selectedDistricts || filters.selectedDistricts.length === 0) {
          Swal.fire({
            icon: "warning",
            title: "District Not Selected",
            text: "Please select at least one district for District Wise data.",
            confirmButtonColor: "#f59e0b",
          });
          return;
        }
        if (!filters?.selectedSeason) {
          Swal.fire({
            icon: "warning",
            title: "Season Not Selected",
            text: "Please select a season for District Wise data.",
            confirmButtonColor: "#f59e0b",
          });
          return;
        }
      }
      
      if (sourceId === "adoption-rate") {
        if (!filters?.selectedSeason) {
          Swal.fire({
            icon: "warning",
            title: "Season Not Selected",
            text: "Please select a season for Adoption Rate data.",
            confirmButtonColor: "#f59e0b",
          });
          return;
        }
        // Varieties are optional - user can specify or leave empty to request all varieties
      }
      
      if (sourceId === "cropping-intensity" && !filters?.selectedDataType) {
        Swal.fire({
          icon: "warning",
          title: "Data Type Not Selected",
          text: "Please select a data type for Cropping Intensity.",
          confirmButtonColor: "#f59e0b",
        });
        return;
      }
    }

    if (!Object.values(downloadFormats).some(val => val)) {
      Swal.fire({
        icon: "warning",
        title: "No Download Format Selected",
        text: "Please select at least one download format.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      Swal.fire({
        title: "Submitting Request...",
        text: "Please wait while we process your data request.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Prepare request data with filters
      const requestData = {
        ...formData,
        dataSources: selectedDataSources.map(sourceId => ({
          id: sourceId,
          filters: dataSourceFilters[sourceId]
        })),
        timeInterval: useCustomRange ? 'Custom' : timeInterval,
        useCustomRange,
        fromYear: useCustomRange ? fromYear : null,
        toYear: useCustomRange ? toYear : null,
        dataAverage,
        downloadFormats: Object.keys(downloadFormats).filter(key => downloadFormats[key])
      };

      // Submit to API
      const response = await axios.post(`${DCRS_API_URL}/api/secondary-data-requests`, requestData);

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Request Submitted!",
          html: `
            <p class="text-gray-600">Your data access request has been submitted successfully.</p>
            <p class="text-sm text-gray-500 mt-2">We will review your request and get back to you via email within 2-3 business days.</p>
          `,
          confirmButtonColor: "#10b981",
        });

        // Reset form but keep user info
        setFormData(prev => ({
          ...prev,
          purpose: "",
        }));
        setSelectedDataSources([]);
        setDataSourceFilters({
          "seasonal-rice": { selectedSeason: "" },
          "varietal-rice": { selectedSeason: "", selectedVarieties: [] },
          "district-wise": { selectedDistricts: [], selectedSeason: "" },
          "adoption-rate": { selectedSeason: "", selectedVarieties: [] },
          "cropping-intensity": { selectedDataType: "" }
        });
        setTimeInterval("10Y");
        setUseCustomRange(false);
        setFromYear(1971);
        setToYear(currentYear);
        setDataAverage(null);
        setDownloadFormats({ csv: false, image: false });

        onClose();
      } else {
        throw new Error(response.data.message || "Submission failed");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.message || "There was an error submitting your request. Please try again.",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const handleCancel = () => {
    setFormData(prev => ({
      ...prev,
      purpose: "",
    }));
    setSelectedDataSources([]);
    setDataSourceFilters({
      "seasonal-rice": { selectedSeason: "" },
      "varietal-rice": { selectedSeason: "", selectedVarieties: [] },
      "district-wise": { selectedDistricts: [], selectedSeason: "" },
      "adoption-rate": { selectedSeason: "", selectedVarieties: [] },
      "cropping-intensity": { selectedDataType: "" }
    });
    setTimeInterval("10Y");
    setUseCustomRange(false);
    setFromYear(1971);
    setToYear(currentYear);
    setDataAverage(null);
    setDownloadFormats({ csv: false, image: false, table: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-4 sm:px-5 md:px-6 py-4 sm:py-5 rounded-t-2xl flex justify-between items-center gap-3 z-10">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
              📋 Request Data Access
            </h3>
            <p className="text-teal-200/70 text-xs mt-0.5">Fill in your details to request data</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg text-teal-200/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
          {/* Personal Information */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Personal Information</span>
              </div>
              {authUser && (
                <span className="inline-flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Auto-filled from profile
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  readOnly={isFieldAutoFilled('name')}
                  className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg outline-none transition-all ${isFieldAutoFilled('name') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Designation *
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  readOnly={isFieldAutoFilled('designation')}
                  className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg outline-none transition-all ${isFieldAutoFilled('designation') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Organization *
                </label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  readOnly={isFieldAutoFilled('organization')}
                  className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg outline-none transition-all ${isFieldAutoFilled('organization') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  readOnly={isFieldAutoFilled('address')}
                  className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg outline-none transition-all ${isFieldAutoFilled('address') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  readOnly={isFieldAutoFilled('email')}
                  className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg outline-none transition-all ${isFieldAutoFilled('email') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                  Mobile *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  readOnly={isFieldAutoFilled('mobile')}
                  className={`w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-lg outline-none transition-all ${isFieldAutoFilled('mobile') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Data Source Selection - Dropdown with Checkboxes */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Required Data Sources * <span className="text-xs text-gray-500">({selectedDataSources.length} selected)</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDataSourcesOpen(!dataSourcesOpen)}
                className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-left flex items-center justify-between hover:border-gray-400 transition-colors"
              >
                <span className={selectedDataSources.length === 0 ? "text-gray-400" : "text-gray-900"}>
                  {selectedDataSources.length === 0 
                    ? "Select data sources..." 
                    : `${selectedDataSources.length} data source(s) selected`}
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform ${dataSourcesOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dataSourcesOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {dataSourceOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-start gap-3 px-3 py-2.5 hover:bg-teal-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDataSources.includes(option.id)}
                        onChange={() => toggleDataSource(option.id)}
                        className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{option.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Filters based on Selected Data Sources */}
          {selectedDataSources.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Data Source Filters
              </h4>

              {selectedDataSources.map((sourceId) => (
                <div key={sourceId} className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-3">
                  <h5 className="text-sm font-semibold text-gray-700 border-b pb-2">
                    {dataSourceOptions.find(opt => opt.id === sourceId)?.title}
                  </h5>

                  {/* Seasonal Rice Filters */}
                  {sourceId === "seasonal-rice" && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Select Season *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {riceSeasons.map((season) => (
                          <button
                            key={season}
                            type="button"
                            onClick={() => updateDataSourceFilter(sourceId, 'selectedSeason', season)}
                            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                              dataSourceFilters[sourceId]?.selectedSeason === season
                                ? "bg-[#0d4a4a] text-white shadow-sm"
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-teal-50"
                            }`}
                          >
                            {season}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Varietal Rice Filters */}
                  {sourceId === "varietal-rice" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Select Season *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[...riceSeasons, "B. Aman"].map((season) => (
                            <button
                              key={season}
                              type="button"
                              onClick={() => updateDataSourceFilter(sourceId, 'selectedSeason', season)}
                              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                                dataSourceFilters[sourceId]?.selectedSeason === season
                                  ? "bg-[#0d4a4a] text-white shadow-sm"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-teal-50"
                              }`}
                            >
                              {season}
                            </button>
                          ))}
                        </div>
                      </div>
                      {dataSourceFilters[sourceId]?.selectedSeason && dataSourceFilters[sourceId]?.selectedSeason !== "B. Aman" && (
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Select Varieties * (Select at least one)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {riceVarieties.map((variety) => (
                              <label
                                key={variety}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border-2 ${
                                  dataSourceFilters[sourceId]?.selectedVarieties?.includes(variety)
                                    ? "bg-teal-100 border-teal-500"
                                    : "bg-white border-gray-300 hover:border-teal-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={dataSourceFilters[sourceId]?.selectedVarieties?.includes(variety)}
                                  onChange={() => toggleArrayFilter(sourceId, 'selectedVarieties', variety)}
                                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium">{variety}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* District Wise Filters */}
                  {sourceId === "district-wise" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Select Districts * 
                          <span className="text-xs text-gray-500 ml-2">
                            ({dataSourceFilters[sourceId]?.selectedDistricts?.length || 0} selected)
                          </span>
                        </label>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => updateDataSourceFilter(sourceId, 'selectedDistricts', bangladeshDistricts)}
                            className="text-xs px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 font-medium"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDataSourceFilter(sourceId, 'selectedDistricts', [])}
                            className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                          {bangladeshDistricts.map((district) => (
                            <label
                              key={district}
                              className={`flex items-center gap-1.5 p-2 rounded cursor-pointer transition-all ${
                                dataSourceFilters[sourceId]?.selectedDistricts?.includes(district)
                                  ? "bg-teal-100 border border-teal-500"
                                  : "bg-gray-50 border border-transparent hover:bg-teal-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={dataSourceFilters[sourceId]?.selectedDistricts?.includes(district)}
                                onChange={() => toggleArrayFilter(sourceId, 'selectedDistricts', district)}
                                className="h-3.5 w-3.5 text-teal-600 rounded"
                              />
                              <span className="text-xs font-medium">{district}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Select Season *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {riceSeasons.map((season) => (
                            <button
                              key={season}
                              type="button"
                              onClick={() => updateDataSourceFilter(sourceId, 'selectedSeason', season)}
                              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                                dataSourceFilters[sourceId]?.selectedSeason === season
                                  ? "bg-[#0d4a4a] text-white shadow-sm"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-teal-50"
                              }`}
                            >
                              {season}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adoption Rate Filters */}
                  {sourceId === "adoption-rate" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Select Season *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {riceSeasons.map((season) => (
                            <button
                              key={season}
                              type="button"
                              onClick={() => updateDataSourceFilter(sourceId, 'selectedSeason', season)}
                              className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                                dataSourceFilters[sourceId]?.selectedSeason === season
                                  ? "bg-[#0d4a4a] text-white shadow-sm"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-teal-50"
                              }`}
                            >
                              {season}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Select Rice Varieties *
                          <span className="text-xs text-gray-500 ml-2">
                            ({dataSourceFilters[sourceId]?.selectedVarieties?.length || 0} selected)
                          </span>
                        </label>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => updateDataSourceFilter(sourceId, 'selectedVarieties', adoptionRateVarieties)}
                            className="text-xs px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 font-medium"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDataSourceFilter(sourceId, 'selectedVarieties', [])}
                            className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                          {adoptionRateVarieties.map((variety) => (
                            <label
                              key={variety}
                              className={`flex items-center gap-1.5 p-2 rounded cursor-pointer transition-all ${
                                dataSourceFilters[sourceId]?.selectedVarieties?.includes(variety)
                                  ? "bg-teal-100 border border-teal-500"
                                  : "bg-gray-50 border border-transparent hover:bg-teal-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={dataSourceFilters[sourceId]?.selectedVarieties?.includes(variety)}
                                onChange={() => toggleArrayFilter(sourceId, 'selectedVarieties', variety)}
                                className="h-3.5 w-3.5 text-teal-600 rounded"
                              />
                              <span className="text-xs font-medium">{variety}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                          💡 Select specific varieties or leave empty to request all varieties for the selected season
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cropping Intensity Filters */}
                  {sourceId === "cropping-intensity" && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Select Data Type *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {croppingDataTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateDataSourceFilter(sourceId, 'selectedDataType', type)}
                            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                              dataSourceFilters[sourceId]?.selectedDataType === type
                                ? "bg-[#0d4a4a] text-white shadow-sm"
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-teal-50"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Year Selection Section */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Data Requirements (Year)
            </h4>
            
            {/* Toggle between Predefined and Custom Year Range */}
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="yearRangeType"
                  checked={!useCustomRange}
                  onChange={() => setUseCustomRange(false)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Predefined Range</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="yearRangeType"
                  checked={useCustomRange}
                  onChange={() => setUseCustomRange(true)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Custom Year Range</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Predefined Time Intervals OR Custom Year Range */}
              <div>
                {!useCustomRange ? (
                  <>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Select Time Interval
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {timeIntervals.map((interval) => (
                        <button
                          key={interval}
                          type="button"
                          onClick={() => {
                            setTimeInterval(interval);
                            setUseCustomRange(false);
                          }}
                          className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                            timeInterval === interval && !useCustomRange
                              ? "bg-[#0d4a4a] text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {interval}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Select Year Range
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">From Year</label>
                        <select
                          value={fromYear}
                          onChange={(e) => {
                            const year = parseInt(e.target.value);
                            setFromYear(year);
                            if (toYear < year) setToYear(year);
                          }}
                          className="w-full px-3 py-2 text-sm border border-teal-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-teal-50"
                        >
                          {availableYears.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-gray-400 mt-5">to</span>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">To Year</label>
                        <select
                          value={toYear}
                          onChange={(e) => {
                            const year = parseInt(e.target.value);
                            setToYear(year);
                            if (fromYear > year) setFromYear(year);
                          }}
                          className="w-full px-3 py-2 text-sm border border-teal-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-teal-50"
                        >
                          {availableYears.filter(y => y >= fromYear).map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-teal-600 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Selected range: {fromYear} - {toYear} ({toYear - fromYear + 1} years)
                    </p>
                  </>
                )}
              </div>

              {/* Data Average */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Data Average (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {dataAverages.map((avg) => (
                    <button
                      key={avg}
                      type="button"
                      onClick={() => setDataAverage(dataAverage === avg ? null : avg)}
                      className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                        dataAverage === avg
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {avg}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Select averaging period to group and average data points
                </p>
              </div>
            </div>
          </div>

          {/* Download Format Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Download Format * <span className="text-xs text-gray-500">(Select at least one)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CSV Data */}
              <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-teal-50 hover:border-teal-300"
                style={{ borderColor: downloadFormats.csv ? '#3b82f6' : '#d1d5db' }}>
                <input
                  type="checkbox"
                  checked={downloadFormats.csv}
                  onChange={() => toggleDownloadFormat('csv')}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">📊 CSV Data</div>
                  <div className="text-xs text-gray-500">Spreadsheet format</div>
                </div>
              </label>

              {/* Chart Image */}
              <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-teal-50 hover:border-teal-300"
                style={{ borderColor: downloadFormats.image ? '#10b981' : '#d1d5db' }}>
                <input
                  type="checkbox"
                  checked={downloadFormats.image}
                  onChange={() => toggleDownloadFormat('image')}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">🖼️ Chart Image</div>
                  <div className="text-xs text-gray-500">PNG format</div>
                </div>
              </label>
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Purpose of Request *
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Please describe how you plan to use this data..."
              required
            ></textarea>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="order-2 sm:order-1 flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="order-1 sm:order-2 flex-1 px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#0d4a4a] text-white rounded-lg hover:bg-[#0a3d3d] transition-colors font-medium shadow-sm"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestDataModal;
