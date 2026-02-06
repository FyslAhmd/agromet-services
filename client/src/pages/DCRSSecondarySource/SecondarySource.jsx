import React, { useState, useRef, useEffect } from "react";
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
  const handleDataSourceChange = (value) => {
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
    <div className="w-full min-h-full lg:p-6">
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Rice Data
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive rice statistics and agricultural data from official sources
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-xl transition-colors shadow-sm shrink-0 self-start sm:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Request Data
          </button>
        </div>

        {/* Data Source Selection Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Label */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-linear-to-br from-[#0a3d3d] to-[#0d5555] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm">Data Source</h3>
                <p className="text-xs text-gray-400 hidden sm:block">Select category to analyze</p>
              </div>
            </div>

            {/* Custom Dropdown */}
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  dropdownOpen
                    ? 'border-teal-400 ring-2 ring-teal-500/20 bg-white'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {selectedDataSource ? (() => {
                  const opt = dataSourceOptions.find(o => o.id === selectedDataSource);
                  return opt ? (
                    <>
                      <span className="shrink-0 text-teal-600">{opt.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">{opt.title}</p>
                        <p className="text-[10px] text-gray-400">{opt.description}</p>
                      </div>
                    </>
                  ) : null;
                })() : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-400 flex-1">Select a data source...</p>
                  </>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Dropdown Panel */}
              {dropdownOpen && (
                <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
                  <div className="max-h-80 overflow-y-auto py-1">
                    {dataSourceOptions.map((option) => {
                      const isActive = selectedDataSource === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            handleDataSourceChange(option.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer ${
                            isActive ? 'bg-teal-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className={`shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-500'}`}>{option.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-teal-700' : 'text-gray-700'}`}>
                              {option.title}
                            </p>
                            <p className={`text-[10px] ${isActive ? 'text-teal-500' : 'text-gray-400'}`}>
                              {option.description}
                            </p>
                          </div>
                          {isActive && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area - Rice Statistics Graphs */}
        {showGraphs && selectedDataSource && (
          <div className="space-y-4 sm:space-y-5">
            {selectedDataSource === "seasonal-rice" && (
              <SeasonalRiceChart selectedSeason={seasonalFilter.selectedSeason} />
            )}
            {selectedDataSource === "export-import" && <ExportImportChart />}
            {selectedDataSource === "cropping-intensity" && (
              <CroppingIntensityChart selectedDataType={croppingFilter.selectedDataType} />
            )}
            {selectedDataSource === "district-wise" && (
              <DistrictWiseChart 
                selectedDistricts={districtFilter.selectedDistricts} 
                selectedSeason={districtFilter.selectedSeason}
              />
            )}
            {selectedDataSource === "varietal-rice" && (
              <VarietalRiceChart 
                selectedSeason={varietalFilter.selectedSeason}
                selectedVarieties={varietalFilter.selectedVarieties}
              />
            )}
            {selectedDataSource === "adoption-rate" && (
              <RiceAdoptionRateChart 
                selectedSeason={adoptionFilter.selectedSeason}
                selectedVarieties={adoptionFilter.selectedVarieties}
              />
            )}
            {selectedDataSource === "faostat" && <FaostatChart />}
          </div>
        )}

        {/* Empty State */}
        {!selectedDataSource && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Select a Data Source</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Choose a data category from the dropdown above to view comprehensive statistics and analysis.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200">BBS Data</span>
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200">DAE Reports</span>
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-full border border-teal-200">BRRI Research</span>
              </div>
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

        {/* Timestamp */}
        <p className="text-center text-xs text-gray-400 pt-2">
          Last updated: {new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} BD
        </p>
      </div>
    </div>
  );
};

export default SecondarySource;
