import React, { useState, useEffect } from "react";
import WeatherChart from "../../components/WeatherChart";
import Swal from 'sweetalert2';
import { useAuthContext } from "../../components/context/AuthProvider";

const AWS = () => {
  const { authUser } = useAuthContext();
  const [location, setLocation] = useState("");
  const [stations, setStations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    selectedWeatherParameters: [],
    selectedDataFormats: [],
    startDate: "",
    endDate: "",
    timeInterval: "month",
    dataInterval: 8,
    useCustomDateRange: false
  });

  // Custom station name mapping
  const stationNameMapping = {
    "42": "BRRI R/S Habiganj",
    "98": "BRRI R/S Faridpur", 
    "122": "BRRI R/S Gopalganj",
    "124": "BRRI R/S Kushtia",
    "126": "BRRI R/S Rajshahi",
    "137": "BRRI R/S Cumilla",
    "147": "BRRI R/S Rangpur",
    "310": "BRRI R/S Sirajganj",
    "352": "BRRI R/S Barishal",
    "375": "BRRI R/S Satkhira",
    "383": "BRRI R/S Sonagazi",
    "415": "BRRI HQ Gazipur",
  };

  const getStationDisplayName = (station) => {
    return stationNameMapping[station.station_id] || station.station_name;
  };

  // Weather parameters configuration
  const weatherParameters = [
    {
      parameter: "Air Temperature",
      title: "Air Temperature",
      unit: "°C",
      icon: "🌡️",
    },
    {
      parameter: "Accumulated Rain 1h",
      title: "Accumulated Rain 1h",
      unit: "mm",
      icon: "🌧️",
    },
    {
      parameter: "Air Humidity",
      title: "Air Humidity",
      unit: "%",
      icon: "💧",
    },
    {
      parameter: "Wind Speed Gust",
      title: "Wind Speed Gust",
      unit: "m/s",
      icon: "💨",
    },
    {
      parameter: "Wind Direction Gust",
      title: "Wind Direction Gust",
      unit: "°",
      icon: "🧭",
    },
    {
      parameter: "Solar Radiation",
      title: "Solar Radiation",
      unit: "W/m²",
      icon: "☀️",
    },
    {
      parameter: "Sunshine Duration",
      title: "Sunshine Duration",
      unit: "hours",
      icon: "🌞",
    },
  ];

  // Fetch stations from API
  const fetchStations = async () => {
    try {
      const response = await fetch(
        "https://saads.brri.gov.bd/api/research-measures/stations"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stations");
      }
      const stationsData = await response.json();
      
      console.log("=== All Weather Stations ===");
      console.log("Total stations:", stationsData.length);
      stationsData.forEach((station, index) => {
        console.log(`${index + 1}. ID: ${station.station_id}, Name: ${station.station_name}`);
      });
      console.log("===========================");
      
      setStations(stationsData);

      if (stationsData.length > 0 && !location) {
        const gazipurStation = stationsData.find(
          (station) =>
            station.station_name?.toLowerCase().includes("gazipur") ||
            station.station_name?.toLowerCase().includes("dae-brri gazipur")
        );

        if (gazipurStation) {
          setLocation(gazipurStation.station_id);
        } else {
          setLocation(stationsData[0].station_id);
        }
      }
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStationChange = (stationId) => {
    setFormData(prev => ({
      ...prev,
      selectedStations: prev.selectedStations.includes(stationId)
        ? prev.selectedStations.filter(id => id !== stationId)
        : [...prev.selectedStations, stationId]
    }));
  };

  const handleWeatherParameterChange = (parameter) => {
    setFormData(prev => ({
      ...prev,
      selectedWeatherParameters: prev.selectedWeatherParameters.includes(parameter)
        ? prev.selectedWeatherParameters.filter(p => p !== parameter)
        : [...prev.selectedWeatherParameters, parameter]
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

  const openRequestModal = () => {
    if (authUser) {
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
    closeDropdowns();
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedStations.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Station Required',
        text: 'Please select at least one weather station.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    if (formData.selectedWeatherParameters.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Parameters Required',
        text: 'Please select at least one weather parameter.',
        confirmButtonColor: '#3085d6'
      });
      return;
    }
    
    if (formData.selectedDataFormats.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Data Format Required',
        text: 'Please select at least one data format (CSV, Image, or Table).',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    try {
      Swal.fire({
        title: 'Submitting Request...',
        text: 'Please wait while we process your weather data request.',
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
        selectedWeatherParameters: formData.selectedWeatherParameters,
        selectedDataFormats: formData.selectedDataFormats,
        dataInterval: formData.dataInterval
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

      const response = await fetch("https://saads.brri.gov.bd/api/cis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      Swal.fire({
        icon: 'success',
        title: 'Request Submitted Successfully!',
        text: 'Your weather data request has been submitted and is now under review. You will be contacted via email once processed.',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Great!',
        draggable: true,
      });

      setIsModalOpen(false);
      setFormData({
        name: "",
        designation: "",
        organization: "",
        address: "",
        email: "",
        mobile: "",
        selectedStations: [],
        selectedWeatherParameters: [],
        selectedDataFormats: [],
        startDate: "",
        endDate: "",
        timeInterval: "month",
        dataInterval: 8,
        useCustomDateRange: false
      });

    } catch (error) {
      console.error("Error submitting request:", error);
      
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'There was an error submitting your request. Please check your internet connection and try again.',
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Try Again',
        footer: '<small>If the problem persists, please contact support.</small>'
      });
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-2 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content mb-2 leading-tight">
            🌤️ Agromet Weather Station (AgWS)
          </h1>
          <p className="text-base-content/70 text-sm sm:text-base lg:text-lg px-2 sm:px-0">
            Acknowledged by{" "}
            <span className="font-semibold text-primary">
              Bangladesh Meteorological Department
            </span>{" "}
            &{" "}
            <span className="font-semibold text-secondary">
              Department of Agricultural Extension
            </span>
          </p>
          <div className="flex justify-center mt-2 sm:mt-3">
            <div className="badge badge-outline badge-sm sm:badge-md lg:badge-lg">
              Real-time Weather Data Analysis
            </div>
          </div>
        </div>

        {/* Compact Station Selection Bar */}
        <div className="card bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 mx-1 sm:mx-0">
          <div className="card-body p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Station Info */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-focus rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-sm sm:text-lg">🏢</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">
                    Weather Station
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {stations.length} monitoring sites available
                  </p>
                </div>
                <button
                  onClick={openRequestModal}
                  className="btn btn-primary btn-sm sm:btn-md flex-shrink-0"
                >
                  📋 Request Data
                </button>
              </div>

              {/* Selection Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="select select-bordered select-sm sm:select-md w-full bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm"
                  >
                    <option value="">🔍 Choose weather station...</option>
                    {stations.map((station) => (
                      <option
                        key={station.station_id}
                        value={station.station_id}
                      >
                        {getStationDisplayName(station)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Charts Grid */}
        {location && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {weatherParameters.map((param, index) => (
                <WeatherChart
                  key={`${location}-${param.parameter}`}
                  stationId={location}
                  parameter={param.parameter}
                  title={param.title}
                  unit={param.unit}
                  icon={param.icon}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!location && (
          <div className="card bg-base-100 shadow-xl mx-1 sm:mx-0">
            <div className="card-body p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                <div className="text-4xl sm:text-6xl lg:text-8xl opacity-30">
                  🌤️
                </div>
                <div className="text-center max-w-sm sm:max-w-md px-2">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content/70 mb-2 sm:mb-3">
                    Select a Weather Station
                  </h3>
                  <p className="text-sm sm:text-base text-base-content/50 leading-relaxed">
                    Choose a weather station from the dropdown above to view
                    comprehensive climate data across 7 different parameters
                    including temperature, humidity, rainfall, wind, and solar
                    radiation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-4 sm:mt-6 py-3 sm:py-4 text-center px-2">
          <p className="text-xs sm:text-sm text-base-content/60 leading-relaxed">
            🕒 Last updated:{" "}
            <span className="hidden sm:inline">
              {new Date().toLocaleString("en-BD", {
                timeZone: "Asia/Dhaka",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              BD Time
            </span>
            <span className="sm:hidden">
              {new Date().toLocaleString("en-BD", {
                timeZone: "Asia/Dhaka",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              BD
            </span>
          </p>
        </div>
      </div>

      {/* Request Data Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">📋 Request Weather Data</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
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

                {/* Designation */}
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

                {/* Organization */}
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

                {/* Address */}
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

                {/* Email */}
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

                {/* Mobile */}
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

              {/* Date Range Type Selection */}
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text font-semibold">Date Range Selection Method *</span>
                </label>
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
                    <span className="label-text">Use Preset Time Interval</span>
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
                    <span className="label-text">Use Custom Date Range</span>
                  </label>
                </div>
              </div>

              {/* Conditional Rendering: Custom Date Range OR Time Interval */}
              {formData.useCustomDateRange ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                <div className="form-control mt-4">
                  <label className="label">
                    <span className="label-text">Time Interval *&nbsp;</span>
                  </label>
                  <select
                    name="timeInterval"
                    value={formData.timeInterval}
                    onChange={handleInputChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="day">1 Day</option>
                    <option value="week">1 Week</option>
                    <option value="month">1 Month</option>
                    <option value="3month">3 Months</option>
                    <option value="6month">6 Months</option>
                    <option value="1year">1 Year</option>
                    <option value="all">All Data</option>
                  </select>
                </div>
              )}

              {/* Data Interval */}
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Data Interval *&nbsp;</span>
                </label>
                <select
                  name="dataInterval"
                  value={formData.dataInterval}
                  onChange={handleInputChange}
                  className="select select-bordered"
                  required
                >
                  <option value={1}>1 Hour</option>
                  <option value={4}>4 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={12}>12 Hours</option>
                  <option value={24}>24 Hours</option>
                  <option value={48}>48 Hours</option>
                  <option value={72}>72 Hours</option>
                </select>
              </div>

              {/* Station and Weather Parameter Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Station Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Weather Stations *</span>
                  </label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="btn btn-outline w-full justify-start"
                      onClick={() => {
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
                      <ul className="absolute top-full left-0 right-0 z-[100] p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto flex flex-col mt-1 border">
                        {stations.map((station) => (
                          <li key={station.station_id} className="w-full">
                            <label className="flex items-center cursor-pointer gap-3 p-2 w-full hover:bg-gray-100 rounded">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={formData.selectedStations.includes(station.station_id)}
                                onChange={() => handleStationChange(station.station_id)}
                              />
                              <span className="text-sm flex-1">{getStationDisplayName(station)}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Weather Parameter Selection */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Weather Parameters *</span>
                  </label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="btn btn-outline w-full justify-start"
                      onClick={() => {
                        setParameterDropdownOpen(!parameterDropdownOpen);
                        setStationDropdownOpen(false);
                      }}
                    >
                      {formData.selectedWeatherParameters.length === 0 
                        ? "Select parameters..." 
                        : `${formData.selectedWeatherParameters.length} parameter(s) selected`}
                      <svg className={`w-4 h-4 ml-auto transition-transform ${parameterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {parameterDropdownOpen && (
                      <ul className="absolute top-full left-0 right-0 z-[100] p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto flex flex-col mt-1 border">
                        {weatherParameters.map((param) => (
                          <li key={param.parameter} className="w-full">
                            <label className="flex items-center cursor-pointer gap-3 p-2 w-full hover:bg-gray-100 rounded">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={formData.selectedWeatherParameters.includes(param.parameter)}
                                onChange={() => handleWeatherParameterChange(param.parameter)}
                              />
                              <span className="text-sm flex-1">{param.icon} {param.title}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Format Selection */}
              <div className="form-control mt-4" onClick={closeDropdowns}>
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
                    <span className="label-text">CSV Data</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={formData.selectedDataFormats.includes('Image')}
                      onChange={() => handleDataFormatChange('Image')}
                    />
                    <span className="label-text">Chart Image</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="modal-action" onClick={closeDropdowns}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    closeDropdowns();
                    setIsModalOpen(false);
                  }}
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
      )}
    </div>
  );
};

export default AWS;
