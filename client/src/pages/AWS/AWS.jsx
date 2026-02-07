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
    <div className="w-full min-h-full">
      {/* Page Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Agromet Weather Station (AgWS)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acknowledged by{" "}
            <span className="font-semibold text-teal-700">
              Bangladesh Meteorological Department
            </span>{" "}
            &amp;{" "}
            <span className="font-semibold text-teal-700">
              Department of Agricultural Extension
            </span>
          </p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          Real-time Weather Data Analysis
        </span>
      </div>

      {/* Station Selection Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Station select */}
          <div className="flex-1 min-w-0">
            <label htmlFor="station-select" className="block text-xs font-medium text-gray-500 mb-1">
              Weather Station
            </label>
            <select
              id="station-select"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all cursor-pointer font-medium text-gray-700 shadow-sm"
            >
              <option value="">Choose weather station...</option>
              {stations.map((station) => (
                <option key={station.station_id} value={station.station_id}>
                  {getStationDisplayName(station)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:self-end">
            <span className="text-xs text-gray-400 hidden sm:inline">
              {stations.length} stations
            </span>
            <button
              onClick={openRequestModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] transition-colors shadow-sm shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Request Data
            </button>
          </div>
        </div>
      </div>

      {/* Weather Charts */}
      {location && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Select a Weather Station
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Choose a weather station from the dropdown above to view
              comprehensive climate data across 7 different parameters
              including temperature, humidity, rainfall, wind, and solar
              radiation.
            </p>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="mt-5 text-center">
        <p className="text-xs text-gray-400">
          Last updated:{" "}
          {new Date().toLocaleString("en-BD", {
            timeZone: "Asia/Dhaka",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          BD Time
        </p>
      </div>

      {/* Request Data Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { closeDropdowns(); setIsModalOpen(false); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Request Weather Data</h3>
                <button onClick={() => { closeDropdowns(); setIsModalOpen(false); }} className="p-1 rounded-lg text-teal-200/70 hover:text-white hover:bg-white/10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" required />
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Designation *</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" required />
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Organization *</label>
                  <input type="text" name="organization" value={formData.organization} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" required />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" required />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" required />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mobile *</label>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" required />
                </div>
              </div>

              {/* Date Range Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Date Range Selection Method *</label>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="dateRangeType" className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500" checked={!formData.useCustomDateRange} onChange={() => setFormData(prev => ({ ...prev, useCustomDateRange: false, startDate: "", endDate: "" }))} />
                    Preset Time Interval
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="radio" name="dateRangeType" className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500" checked={formData.useCustomDateRange} onChange={() => setFormData(prev => ({ ...prev, useCustomDateRange: true, timeInterval: "" }))} />
                    Custom Date Range
                  </label>
                </div>
              </div>

              {/* Conditional: Custom Date Range OR Time Interval */}
              {formData.useCustomDateRange ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">From Date *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" max={getTodayDate()} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To Date *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all" min={formData.startDate} max={getTodayDate()} required />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Time Interval *</label>
                  <select name="timeInterval" value={formData.timeInterval} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all cursor-pointer" required>
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data Interval *</label>
                <select name="dataInterval" value={formData.dataInterval} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all cursor-pointer" required>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Station Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Weather Stations *</label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                      onClick={() => { setStationDropdownOpen(!stationDropdownOpen); setParameterDropdownOpen(false); }}
                    >
                      <span className="text-gray-700 truncate">
                        {formData.selectedStations.length === 0
                          ? "Select stations..."
                          : `${formData.selectedStations.length} station(s) selected`}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${stationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {stationDropdownOpen && (
                      <ul className="absolute top-full left-0 right-0 z-50 mt-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                        {stations.map((station) => (
                          <li key={station.station_id}>
                            <label className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer hover:bg-teal-50 transition-colors">
                              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={formData.selectedStations.includes(station.station_id)} onChange={() => handleStationChange(station.station_id)} />
                              <span className="text-sm text-gray-700">{getStationDisplayName(station)}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Weather Parameter Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Weather Parameters *</label>
                  <div className="relative w-full">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                      onClick={() => { setParameterDropdownOpen(!parameterDropdownOpen); setStationDropdownOpen(false); }}
                    >
                      <span className="text-gray-700 truncate">
                        {formData.selectedWeatherParameters.length === 0
                          ? "Select parameters..."
                          : `${formData.selectedWeatherParameters.length} parameter(s) selected`}
                      </span>
                      <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${parameterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {parameterDropdownOpen && (
                      <ul className="absolute top-full left-0 right-0 z-50 mt-1 p-1.5 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                        {weatherParameters.map((param) => (
                          <li key={param.parameter}>
                            <label className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer hover:bg-teal-50 transition-colors">
                              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={formData.selectedWeatherParameters.includes(param.parameter)} onChange={() => handleWeatherParameterChange(param.parameter)} />
                              <span className="text-sm text-gray-700">{param.icon} {param.title}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Format */}
              <div onClick={closeDropdowns}>
                <label className="block text-xs font-medium text-gray-500 mb-2">Required Data Formats *</label>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={formData.selectedDataFormats.includes('CSV')} onChange={() => handleDataFormatChange('CSV')} />
                    CSV Data
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" checked={formData.selectedDataFormats.includes('Image')} onChange={() => handleDataFormatChange('Image')} />
                    Chart Image
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100" onClick={closeDropdowns}>
                <button type="button" onClick={() => { closeDropdowns(); setIsModalOpen(false); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-lg transition-colors shadow-sm">
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
