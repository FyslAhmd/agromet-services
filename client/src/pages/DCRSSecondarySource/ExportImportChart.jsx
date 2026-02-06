import React, { useState, useEffect } from "react";
import axios from "axios";
import { DCRS_API_URL } from "../../config/api";
import MultiLineRiceChart from "./MultiLineRiceChart";

const ExportImportChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportImportData, setExportImportData] = useState({
    export: [],
    import: []
  });

  useEffect(() => {
    const fetchExportImportData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Fetching export-import data...");
        
        const response = await axios.get(`${DCRS_API_URL}/api/export-import`);
        
        console.log("Export-Import API Response:", response.data);

        const data = response.data.data || response.data;
        
        console.log("Export-Import data array:", data);

        // Process the data
        const processedData = processExportImportData(data);
        
        console.log("Processed Export-Import Data:", processedData);
        
        setExportImportData(processedData);
      } catch (err) {
        console.error("Error fetching export-import data:", err);
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchExportImportData();
  }, []);

  const processExportImportData = (data) => {
    const exportData = [];
    const importData = [];

    // Sort data by year
    const sortedData = data.sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearA - yearB;
    });

    sortedData.forEach(record => {
      const year = parseInt(record.year);
      const exportValue = parseFloat(record.exportQuantity) || 0;
      const importValue = parseFloat(record.importQuantity) || 0;

      // Add to arrays if values are non-zero
      if (exportValue > 0) {
        exportData.push([year, exportValue]);
      }
      if (importValue > 0) {
        importData.push([year, importValue]);
      }
    });

    return {
      export: exportData,
      import: importData
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-4 border-teal-200 border-t-teal-600 mb-3 sm:mb-4"></div>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4 text-center">Loading export-import data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-5 md:p-6 rounded-r-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-red-800 font-bold text-sm sm:text-base md:text-lg">Error Loading Data</h3>
            <p className="text-red-600 text-xs sm:text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (exportImportData.export.length === 0 && exportImportData.import.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 sm:p-5 md:p-6 rounded-r-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-yellow-800 font-bold text-sm sm:text-base md:text-lg">No Data Available</h3>
            <p className="text-yellow-600 text-xs sm:text-sm mt-1">
              No export-import data found. Please check if data has been uploaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for MultiLineRiceChart
  const multiLineData = [
    {
      name: "Export",
      data: exportImportData.export,
      color: "#10b981" // Green
    },
    {
      name: "Import",
      data: exportImportData.import,
      color: "#ef4444" // Red
    }
  ];

  // Display chart
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] text-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="text-3xl">🌍</span>
          Rice Export and Import Statistics
        </h2>
        <p className="text-teal-200/70 mt-2">
          Historical data showing rice export and import trends
        </p>
      </div>

      {/* Multi-Line Chart for Export and Import */}
      <MultiLineRiceChart
        title="Rice Export & Import"
        unit="Thousand Metric Tons (000' MT)"
        seriesData={multiLineData}
        icon="🌍"
      />
    </div>
  );
};

export default ExportImportChart;
