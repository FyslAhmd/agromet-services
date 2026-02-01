import React from "react";
import { Line } from "react-chartjs-2";

const ChartDisplay = ({ chartData, chartOptions, loading, selectedParameter, dataParameters }) => {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-12 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-gray-600">Loading data...</p>
        <p className="text-sm text-gray-400 mt-2">Please wait while we fetch your data</p>
      </div>
    );
  }

  if (chartData && chartData.datasets && chartData.datasets.length > 0) {
    const paramInfo = dataParameters.find((p) => p.value === selectedParameter);
    
    return (
      <div className="rounded-2xl overflow-hidden">
        {/* Chart Header */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {paramInfo?.label || "Historical Data"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Showing data for {chartData.datasets.length} station{chartData.datasets.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
          <div style={{ height: "450px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Data Summary */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartData.datasets.map((dataset, idx) => {
              const values = dataset.data.map(d => d.y);
              const min = Math.min(...values).toFixed(1);
              const max = Math.max(...values).toFixed(1);
              const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
              
              return (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: dataset.borderColor }}
                    ></div>
                    <span className="text-sm font-medium text-white truncate">
                      {dataset.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Min</span>
                      <p className="text-emerald-400 font-semibold">{min}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Avg</span>
                      <p className="text-blue-400 font-semibold">{avg}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Max</span>
                      <p className="text-rose-400 font-semibold">{max}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {dataset.data.length} data points
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (selectedParameter) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-12 text-center">
        <div className="text-7xl mb-6">📈</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-3">
          Ready to Visualize
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Select stations and click "Generate Chart" to view historical climate data trends
        </p>
      </div>
    );
  }

  return null;
};

export default ChartDisplay;
