import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../config/api";
import { useAuthContext } from "../../../components/context/AuthProvider";
import { dataParameters, intervals } from "./chartConfig";

const RequestDataModal = ({ isOpen, onClose, availableStations }) => {
  const { authUser } = useAuthContext();
  
  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const [parameterDropdownOpen, setParameterDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    organization: "",
    address: "",
    email: "",
    mobile: "",
    selectedStations: [],
    selectedParameters: [],
    selectedDataFormats: [],
    startDate: "",
    endDate: "",
    timeInterval: "1Y",
    dataAverage: "none",
    useCustomDateRange: false
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStationChange = (station) => {
    setFormData(prev => ({
      ...prev,
      selectedStations: prev.selectedStations.includes(station)
        ? prev.selectedStations.filter(s => s !== station)
        : [...prev.selectedStations, station]
    }));
  };

  const handleParameterChange = (paramValue) => {
    setFormData(prev => ({
      ...prev,
      selectedParameters: prev.selectedParameters.includes(paramValue)
        ? prev.selectedParameters.filter(p => p !== paramValue)
        : [...prev.selectedParameters, paramValue]
    }));
  };

  const handleDataFormatChange = (format) => {
    setFormData(prev => ({
      ...prev,
      selectedDataFormats: prev.selectedDataFormats.includes(format)
        ? prev.selectedDataFormats.filter(f => f !== format)
        : [...prev.selectedDataFormats, format]
    }));
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const closeDropdowns = () => {
    setStationDropdownOpen(false);
    setParameterDropdownOpen(false);
  };

  // Data Average options (depends on time interval selected)
  const getDataAverageOptions = () => {
    const timeRangeMonths = {
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "5Y": 60,
      "10Y": 120,
      "20Y": 240,
      "30Y": 360,
      "50Y": 600,
      "All": Infinity,
    };

    const dataAverageOptions = [
      { value: "none", label: "None (Raw Data)" },
      { value: "1W", label: "Weekly Average" },
      { value: "1M", label: "Monthly Average" },
      { value: "3M", label: "3-Month Average" },
      { value: "6M", label: "6-Month Average" },
      { value: "1Y", label: "Yearly Average" },
      { value: "5Y", label: "5-Year Average" },
      { value: "10Y", label: "10-Year Average" },
      { value: "20Y", label: "20-Year Average" },
      { value: "30Y", label: "30-Year Average" },
    ];

    const selectedRangeMonths = timeRangeMonths[formData.timeInterval] || Infinity;

    // Filter: average interval must be less than half the time range
    return dataAverageOptions.filter(opt => {
      if (opt.value === "none") return true;
      const avgMonths = {
        "1W": 0.25,
        "1M": 1,
        "3M": 3,
        "6M": 6,
        "1Y": 12,
        "5Y": 60,
        "10Y": 120,
        "20Y": 240,
        "30Y": 360,
      };
      return (avgMonths[opt.value] || 0) <= selectedRangeMonths / 2;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.selectedStations.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Stations Required',
        text: 'Please select at least one research station.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    if (formData.selectedParameters.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Parameters Required',
        text: 'Please select at least one climate parameter.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    if (formData.selectedDataFormats.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Data Format Required',
        text: 'Please select at least one data format (CSV or Image).',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    if (formData.useCustomDateRange && (!formData.startDate || !formData.endDate)) {
      Swal.fire({
        icon: 'error',
        title: 'Date Range Required',
        text: 'Please select both start and end dates.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Submitting Request...',
        text: 'Please wait while we process your historical data request.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const requestData = {
        name: formData.name,
        designation: formData.designation,
        organization: formData.organization,
        address: formData.address,
        email: formData.email,
        mobile: formData.mobile,
        selectedStations: formData.selectedStations,
        selectedParameters: formData.selectedParameters,
        selectedDataFormats: formData.selectedDataFormats,
        dataAverage: formData.dataAverage
      };

      if (formData.useCustomDateRange) {
        requestData.startDate = formData.startDate;
        requestData.endDate = formData.endDate;
        requestData.timeInterval = null;
      } else {
        requestData.timeInterval = formData.timeInterval;
        requestData.startDate = null;
        requestData.endDate = null;
      }

      const response = await axios.post(
        `${API_BASE_URL}/historical-data-requests`,
        requestData
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Request Submitted Successfully!',
          text: 'Your historical data request has been submitted and is now under review. You will be contacted via email once processed.',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Great!',
        });

        onClose();
        // Reset form but keep user info
        setFormData(prev => ({
          ...prev,
          selectedStations: [],
          selectedParameters: [],
          selectedDataFormats: [],
          startDate: "",
          endDate: "",
          timeInterval: "1Y",
          dataAverage: "none",
          useCustomDateRange: false
        }));
      } else {
        throw new Error(response.data.message || "Failed to submit request");
      }

    } catch (error) {
      console.error("Error submitting request:", error);
      
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.response?.data?.message || 'There was an error submitting your request. Please try again.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Try Again',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeDropdowns}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-semibold text-white">Request Historical Climate Data</h3>
            <p className="text-teal-200/70 text-xs mt-0.5">Fill out the form to request data exports</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-teal-200/70 hover:text-white hover:bg-white/10 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} readOnly={isFieldAutoFilled('name')} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${isFieldAutoFilled('name') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Designation *</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} readOnly={isFieldAutoFilled('designation')} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${isFieldAutoFilled('designation') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Organization *</label>
                  <input type="text" name="organization" value={formData.organization} onChange={handleInputChange} readOnly={isFieldAutoFilled('organization')} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${isFieldAutoFilled('organization') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} readOnly={isFieldAutoFilled('address')} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${isFieldAutoFilled('address') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} readOnly={isFieldAutoFilled('email')} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${isFieldAutoFilled('email') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500'}`} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mobile *</label>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} readOnly={isFieldAutoFilled('mobile')} className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all ${isFieldAutoFilled('mobile') ? 'bg-gray-50 border-gray-100 text-gray-600 cursor-default' : 'border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500'}`} required />
                </div>
              </div>
            </div>

            {/* Time Range Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Time Range</span>
              </div>

              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="dateRangeType"
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500/30"
                    checked={!formData.useCustomDateRange}
                    onChange={() => setFormData(prev => ({ ...prev, useCustomDateRange: false, startDate: "", endDate: "" }))}
                  />
                  <span className="text-sm text-gray-700">Preset Interval</span>
                </label>
                <label className="flex items-center cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="dateRangeType"
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500/30"
                    checked={formData.useCustomDateRange}
                    onChange={() => setFormData(prev => ({ ...prev, useCustomDateRange: true, timeInterval: "" }))}
                  />
                  <span className="text-sm text-gray-700">Custom Date Range</span>
                </label>
              </div>

              {formData.useCustomDateRange ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">From Date *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" max={getTodayDate()} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">To Date *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" min={formData.startDate} max={getTodayDate()} required />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Time Interval *</label>
                  <select name="timeInterval" value={formData.timeInterval} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all bg-white" required>
                    {intervals.map(interval => (
                      <option key={interval.value} value={interval.value}>{interval.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Data Average */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Data Averaging</label>
                <select name="dataAverage" value={formData.dataAverage} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all bg-white">
                  {getDataAverageOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Aggregate data points for smoother trends</p>
              </div>
            </div>

            {/* Data Selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Data Selection</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Station Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Research Stations *</label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-left"
                      onClick={(e) => { e.stopPropagation(); setStationDropdownOpen(!stationDropdownOpen); setParameterDropdownOpen(false); }}
                    >
                      <span className={formData.selectedStations.length === 0 ? "text-gray-400" : "text-gray-700"}>
                        {formData.selectedStations.length === 0 ? "Select stations..." : `${formData.selectedStations.length} station(s) selected`}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${stationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {stationDropdownOpen && (
                      <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1.5">
                        {availableStations && availableStations.length > 0 ? (
                          availableStations.map((station) => (
                            <li key={station}>
                              <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500/30" checked={formData.selectedStations.includes(station)} onChange={() => handleStationChange(station)} />
                                <span className="text-sm text-gray-700">{station}</span>
                              </label>
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2 text-xs text-gray-400">Select a parameter first</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Parameter Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Climate Parameters *</label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors text-left"
                      onClick={(e) => { e.stopPropagation(); setParameterDropdownOpen(!parameterDropdownOpen); setStationDropdownOpen(false); }}
                    >
                      <span className={formData.selectedParameters.length === 0 ? "text-gray-400" : "text-gray-700"}>
                        {formData.selectedParameters.length === 0 ? "Select parameters..." : `${formData.selectedParameters.length} parameter(s) selected`}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${parameterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {parameterDropdownOpen && (
                      <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1.5">
                        {dataParameters.map((param) => (
                          <li key={param.value}>
                            <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                              <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500/30" checked={formData.selectedParameters.includes(param.value)} onChange={() => handleParameterChange(param.value)} />
                              <span className="text-sm text-gray-700">{param.icon} {param.label}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Formats */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-2">Required Data Formats *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500/30" checked={formData.selectedDataFormats.includes('CSV')} onChange={() => handleDataFormatChange('CSV')} />
                    <span className="text-sm text-gray-700">📄 CSV Data</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500/30" checked={formData.selectedDataFormats.includes('Image')} onChange={() => handleDataFormatChange('Image')} />
                    <span className="text-sm text-gray-700">📈 Chart Image</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Selection Summary */}
            {(formData.selectedStations.length > 0 || formData.selectedParameters.length > 0) && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Selection Summary</p>
                {formData.selectedStations.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] text-gray-400">Stations:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.selectedStations.map(station => (
                        <span key={station} className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-md">{station}</span>
                      ))}
                    </div>
                  </div>
                )}
                {formData.selectedParameters.length > 0 && (
                  <div>
                    <span className="text-[11px] text-gray-400">Parameters:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.selectedParameters.map(param => {
                        const paramInfo = dataParameters.find(p => p.value === param);
                        return (
                          <span key={param} className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                            {paramInfo?.icon} {paramInfo?.label.split('(')[0].trim() || param}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-xl transition-colors">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestDataModal;
