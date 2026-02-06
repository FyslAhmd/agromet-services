// Utility functions for CIS components

export const formatDate = (dateString) => {
  if (!dateString || dateString === null) {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusBadge = (status) => {
  switch (status) {
    case "Pending":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
          Pending
        </span>
      );
    case "Approved":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
          Approved
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
          Rejected
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
          Unknown
        </span>
      );
  }
};

export const getTimeIntervalLabel = (interval) => {
  const labels = {
    // AgWS labels
    day: "1 Day",
    week: "1 Week",
    month: "1 Month",
    "3month": "3 Months",
    "6month": "6 Months",
    "1year": "1 Year",
    all: "All Data",
    // Historical Data labels
    "1D": "1 Day",
    "1W": "1 Week",
    "1M": "1 Month",
    "3M": "3 Months",
    "6M": "6 Months",
    "1Y": "1 Year",
    "5Y": "5 Years",
    "10Y": "10 Years",
    "20Y": "20 Years",
    "30Y": "30 Years",
    "50Y": "50 Years",
    "All": "All Data",
  };
  return labels[interval] || interval;
};

export const getDataAverageLabel = (average) => {
  const labels = {
    none: "None (Raw Data)",
    "1W": "Weekly Average",
    "1M": "Monthly Average",
    "3M": "3-Month Average",
    "6M": "6-Month Average",
    "1Y": "Yearly Average",
    "5Y": "5-Year Average",
    "10Y": "10-Year Average",
    "20Y": "20-Year Average",
    "30Y": "30-Year Average",
  };
  return labels[average] || average;
};
