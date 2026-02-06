import React from 'react';

const CISRequestModal = ({
  showViewModal,
  setShowViewModal,
  selectedRequest,
  dataType,
  getStatusBadge,
  formatDate,
  formatDateTime,
  getTimeIntervalLabel,
  getDataAverageLabel,
  handleAcceptRequest,
  handleRejectRequest,
  handleAcceptSecondaryRequest,
  handleRejectSecondaryRequest,
}) => {
  if (!showViewModal || !selectedRequest) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {dataType === "agws"
            ? "Weather Data Request Details"
            : dataType === "historical"
            ? "Historical Climate Data Request Details"
            : "Secondary Source Data Request Details"}
          <div className="ml-auto">{getStatusBadge(selectedRequest.status)}</div>
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personal Information
              </h4>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Full Name</span>
                  <span className="text-base font-semibold">{selectedRequest.name || "Not Provided"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Designation</span>
                  <span className="text-base">{selectedRequest.designation || "Not Provided"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Organization</span>
                  <span className="text-base">{selectedRequest.organization || "Not Provided"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Address</span>
                  <span className="text-base">{selectedRequest.address || "Not Provided"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Contact Information
              </h4>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Email Address</span>
                  <span className="text-base break-all">{selectedRequest.email || "Not Provided"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Mobile Number</span>
                  <span className="text-base">{selectedRequest.mobile || "Not Provided"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Request Submitted</span>
                  <span className="text-base">{selectedRequest.submitTime ? formatDateTime(selectedRequest.submitTime) : "Not Available"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600">Request ID</span>
                  <span className="text-base font-mono">
                    #{(selectedRequest.id || 0).toString().padStart(6, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Stations - Only show for agws and historical */}
        {dataType !== "secondary" && (
          <div className="card bg-base-200 mt-6">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {dataType === "agws" ? "Selected Weather Stations" : "Selected Research Stations"} (
                {selectedRequest.selectedStations?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {(selectedRequest.selectedStations || []).map((station, index) => (
                  <div key={index} className="badge badge-outline badge-lg p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {station}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weather/Climate Parameters - Only show for agws and historical */}
        {dataType !== "secondary" && (
          <div className="card bg-base-200 mt-6">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                {dataType === "agws" ? "Weather Parameters" : "Climate Parameters"} (
                {selectedRequest.selectedWeatherParameters?.length || 0})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(selectedRequest.selectedWeatherParameters || []).map((parameter, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-base-100 rounded-lg border"
                  >
                    <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-warning"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium">{parameter}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Purpose and Methodology - Only show for secondary */}
        {dataType === "secondary" && (
          <div className="card bg-base-200 mt-6">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Request Details
              </h4>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-600 mb-1">Purpose of Request</span>
                  <div className="p-3 bg-base-100 rounded border">
                    <p className="text-sm">{selectedRequest.purpose || "Not Specified"}</p>
                  </div>
                </div>
                {selectedRequest.methodology && selectedRequest.methodology !== "Not Specified" && (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-600 mb-1">Methodology</span>
                    <div className="p-3 bg-base-100 rounded border">
                      <p className="text-sm">{selectedRequest.methodology}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Sources - Only show for secondary */}
        {dataType === "secondary" && (
            <div className="card bg-base-200 mt-6">
              <div className="card-body p-4">
                <h4 className="card-title text-base mb-3 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                  Data Sources Requested ({selectedRequest.dataSources?.length || 0})
                </h4>
                {selectedRequest.dataSources && selectedRequest.dataSources.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRequest.dataSources.map((source, index) => (
                    <div
                      key={index}
                      className="bg-primary/10 border border-primary/20 p-4 rounded-lg"
                    >
                      <h5 className="font-semibold text-primary mb-2">
                        {source.name || source.id || "Data Source"}
                      </h5>
                      {source.filters && Object.keys(source.filters).length > 0 && (
                        <div className="text-sm text-gray-700 space-y-1">
                          {Object.entries(source.filters).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className="text-gray-600">
                                {Array.isArray(value) ? value.join(", ") : value || "All"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto mb-2 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="font-medium">No data sources specified</p>
                    <p className="text-sm mt-1">This request doesn't include specific data source information</p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Data Formats */}
        <div className="card bg-base-200 mt-6">
          <div className="card-body p-4">
            <h4 className="card-title text-base mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Required Data Formats ({selectedRequest.selectedDataFormats?.length || 0})
            </h4>
            <div className="flex flex-wrap gap-3">
              {selectedRequest.selectedDataFormats && selectedRequest.selectedDataFormats.length > 0 ? (
                selectedRequest.selectedDataFormats.map((format, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-base-100 rounded-lg border border-primary/20"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    {format === "CSV" && <span className="text-lg">📊</span>}
                    {format === "Image" && <span className="text-lg">📈</span>}
                    {format === "Table" && <span className="text-lg">📋</span>}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{format}</span>
                    <span className="text-xs text-gray-500">
                      {format === "CSV" && "Raw Data"}
                      {format === "Image" && "Chart Image"}
                      {format === "Table" && "Formatted Table"}
                    </span>
                  </div>
                </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No specific format requested - CSV format will be used by default</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        {(selectedRequest.status === "Approved" || selectedRequest.status === "Rejected") &&
          selectedRequest.remarks && (
            <div className="card bg-base-200 mt-6">
              <div className="card-body p-4">
                <h4 className="card-title text-base mb-3 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-warning"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  {selectedRequest.status === "Approved" ? "Approval" : "Rejection"} Remarks
                </h4>
                <div
                  className={`p-4 rounded-lg ${
                    selectedRequest.status === "Approved"
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      selectedRequest.status === "Approved" ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {selectedRequest.remarks}
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Date Range and Intervals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-info"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Date Range
              </h4>
              <div className="space-y-3">
                {selectedRequest.startDate && selectedRequest.endDate ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                      <span className="text-sm font-medium">From:</span>
                      <span className="text-base font-semibold">
                        {formatDate(selectedRequest.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                      <span className="text-sm font-medium">To:</span>
                      <span className="text-base font-semibold">
                        {formatDate(selectedRequest.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-info/10 rounded border border-info/20">
                      <span className="text-sm font-medium">Duration:</span>
                      <span className="text-base font-semibold text-info">
                        {Math.ceil(
                          (new Date(selectedRequest.endDate) -
                            new Date(selectedRequest.startDate)) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                    <span className="text-sm font-medium">Date Range:</span>
                    <span className="text-base font-semibold text-gray-500 italic">
                      Using preset time interval
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h4 className="card-title text-base mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Data Intervals
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                  <span className="text-sm font-medium">Time Interval:</span>
                  <span className="badge badge-info">
                    {getTimeIntervalLabel(selectedRequest.timeInterval)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                  <span className="text-sm font-medium">
                    {dataType === "agws" ? "Data Interval:" : "Data Average:"}
                  </span>
                  <span className="badge badge-success">
                    {dataType === "agws"
                      ? `${selectedRequest.dataInterval} Hours`
                      : getDataAverageLabel(selectedRequest.dataInterval)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-action mt-8">
          <div className="flex gap-2 flex-wrap">
            {selectedRequest.status === "Pending" && (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    if (dataType === "secondary") {
                      handleAcceptSecondaryRequest(selectedRequest.id, selectedRequest.name);
                    } else {
                      handleAcceptRequest(selectedRequest.id, selectedRequest.name);
                    }
                    setShowViewModal(false);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Accept Request
                </button>
                <button
                  className="btn btn-error"
                  onClick={() => {
                    if (dataType === "secondary") {
                      handleRejectSecondaryRequest(selectedRequest.id, selectedRequest.name);
                    } else {
                      handleRejectRequest(selectedRequest.id, selectedRequest.name);
                    }
                    setShowViewModal(false);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Reject Request
                </button>
              </>
            )}
            <button className="btn btn-ghost" onClick={() => setShowViewModal(false)}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CISRequestModal;
