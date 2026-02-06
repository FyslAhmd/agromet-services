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

  // Pre-fill user data if logged in
  useEffect(() => {
    if (authUser && isOpen) {
      const registeredUser = authUser.RegistedUser || {};
      setFormData(prev => ({
        ...prev,
        name: authUser.name || registeredUser.name || "",
        designation: registeredUser.designation || "",
        organization: "",
        address: registeredUser.address || 
                 [registeredUser.village, registeredUser.union, registeredUser.upazila, registeredUser.district, registeredUser.division]
                   .filter(Boolean)
                   .join(", ") || "",
        email: registeredUser.email || registeredUser.emailOfficial || "",
        mobile: authUser.mobileNumber || registeredUser.mobileNumber || "",
      }));
    }
  }, [authUser, isOpen]);

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
        // Reset form
        setFormData({
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
    <div className="modal modal-open" onClick={closeDropdowns}>
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          📊 Request Historical Climate Data
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="divider text-sm text-gray-500">Personal Information</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name *</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Designation *</span>
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Organization *</span>
              </label>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Address *</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email *</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Mobile *</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="input input-bordered"
                required
              />
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="divider text-sm text-gray-500">Time Range Selection</div>

          <div className="form-control">
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="radio"
                  name="dateRangeType"
                  className="radio radio-primary"
                  checked={!formData.useCustomDateRange}
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    useCustomDateRange: false,
                    startDate: "",
                    endDate: ""
                  }))}
                />
                <span className="label-text">Preset Time Interval</span>
              </label>
              
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="radio"
                  name="dateRangeType"
                  className="radio radio-primary"
                  checked={formData.useCustomDateRange}
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    useCustomDateRange: true,
                    timeInterval: ""
                  }))}
                />
                <span className="label-text">Custom Date Range</span>
              </label>
            </div>
          </div>

          {formData.useCustomDateRange ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">From Date *</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  max={getTodayDate()}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">To Date *</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  min={formData.startDate}
                  max={getTodayDate()}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Time Interval *</span>
              </label>
              <select
                name="timeInterval"
                value={formData.timeInterval}
                onChange={handleInputChange}
                className="select select-bordered"
                required
              >
                {intervals.map(interval => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Data Average */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Data Averaging</span>
            </label>
            <select
              name="dataAverage"
              value={formData.dataAverage}
              onChange={handleInputChange}
              className="select select-bordered"
            >
              {getDataAverageOptions().map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                Aggregate data points for smoother trends
              </span>
            </label>
          </div>

          {/* Station and Parameter Selection */}
          <div className="divider text-sm text-gray-500">Data Selection</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Station Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Research Stations *</span>
              </label>
              <div className="relative w-full">
                <button
                  type="button"
                  className="btn btn-outline w-full justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStationDropdownOpen(!stationDropdownOpen);
                    setParameterDropdownOpen(false);
                  }}
                >
                  {formData.selectedStations.length === 0 
                    ? "Select stations..." 
                    : `${formData.selectedStations.length} station(s) selected`}
                  <svg className={`w-4 h-4 ml-auto transition-transform ${stationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {stationDropdownOpen && (
                  <ul className="absolute top-full left-0 right-0 z-100 p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto flex flex-col mt-1 border">
                    {availableStations && availableStations.length > 0 ? (
                      availableStations.map((station) => (
                        <li key={station} className="w-full">
                          <label className="flex items-center cursor-pointer gap-3 p-2 w-full hover:bg-gray-100 rounded">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={formData.selectedStations.includes(station)}
                              onChange={() => handleStationChange(station)}
                            />
                            <span className="text-sm flex-1">{station}</span>
                          </label>
                        </li>
                      ))
                    ) : (
                      <li className="p-2 text-gray-500 text-sm">
                        Select a parameter first to load available stations
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Parameter Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Climate Parameters *</span>
              </label>
              <div className="relative w-full">
                <button
                  type="button"
                  className="btn btn-outline w-full justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    setParameterDropdownOpen(!parameterDropdownOpen);
                    setStationDropdownOpen(false);
                  }}
                >
                  {formData.selectedParameters.length === 0 
                    ? "Select parameters..." 
                    : `${formData.selectedParameters.length} parameter(s) selected`}
                  <svg className={`w-4 h-4 ml-auto transition-transform ${parameterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {parameterDropdownOpen && (
                  <ul className="absolute top-full left-0 right-0 z-100 p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto flex flex-col mt-1 border">
                    {dataParameters.map((param) => (
                      <li key={param.value} className="w-full">
                        <label className="flex items-center cursor-pointer gap-3 p-2 w-full hover:bg-gray-100 rounded">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={formData.selectedParameters.includes(param.value)}
                            onChange={() => handleParameterChange(param.value)}
                          />
                          <span className="text-sm flex-1">{param.icon} {param.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Data Format Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Required Data Formats *</span>
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.selectedDataFormats.includes('CSV')}
                  onChange={() => handleDataFormatChange('CSV')}
                />
                <span className="label-text">📄 CSV Data</span>
              </label>
              
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.selectedDataFormats.includes('Image')}
                  onChange={() => handleDataFormatChange('Image')}
                />
                <span className="label-text">📈 Chart Image</span>
              </label>
            </div>
          </div>

          {/* Selected Items Summary */}
          {(formData.selectedStations.length > 0 || formData.selectedParameters.length > 0) && (
            <div className="bg-base-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-sm mb-2">Selection Summary:</h4>
              {formData.selectedStations.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500">Stations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.selectedStations.map(station => (
                      <span key={station} className="badge badge-sm badge-primary">{station}</span>
                    ))}
                  </div>
                </div>
              )}
              {formData.selectedParameters.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500">Parameters:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.selectedParameters.map(param => {
                      const paramInfo = dataParameters.find(p => p.value === param);
                      return (
                        <span key={param} className="badge badge-sm badge-secondary">
                          {paramInfo?.icon} {paramInfo?.label.split('(')[0].trim() || param}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestDataModal;
