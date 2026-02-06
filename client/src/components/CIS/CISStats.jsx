import React from 'react';

const CISStats = ({ requests }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
        <div className="stat-figure text-primary hidden md:block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
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
        </div>
        <div className="stat-title text-xs md:text-sm">Total Requests</div>
        <div className="stat-value text-primary text-2xl md:text-4xl">{requests.length}</div>
        <div className="stat-desc text-[10px] md:text-xs">All time submissions</div>
      </div>

      <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
        <div className="stat-figure text-warning hidden md:block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
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
        </div>
        <div className="stat-title text-xs md:text-sm">Pending</div>
        <div className="stat-value text-warning text-2xl md:text-4xl">
          {requests.filter((r) => r.status === "Pending").length}
        </div>
        <div className="stat-desc text-[10px] md:text-xs">Awaiting review</div>
      </div>

      <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
        <div className="stat-figure text-success hidden md:block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="stat-title text-xs md:text-sm">Approved</div>
        <div className="stat-value text-success text-2xl md:text-4xl">
          {requests.filter((r) => r.status === "Approved").length}
        </div>
        <div className="stat-desc text-[10px] md:text-xs">Successfully processed</div>
      </div>

      <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
        <div className="stat-figure text-error hidden md:block">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="stat-title text-xs md:text-sm">Rejected</div>
        <div className="stat-value text-error text-2xl md:text-4xl">
          {requests.filter((r) => r.status === "Rejected").length}
        </div>
        <div className="stat-desc text-[10px] md:text-xs">Declined requests</div>
      </div>
    </div>
  );
};

export default CISStats;
