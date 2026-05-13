import React from 'react';
import ValidationChart from './ValidationChart';

const formatNumber = (value, unit = "") => {
  if (value === null || value === undefined || value === "") return "-";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)}${unit ? ` ${unit}` : ""}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const ValidationParameterCard = ({ parameter, unit, records }) => {
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  const dates = sortedRecords.map(r => formatDate(r.date));
  const forecastData = sortedRecords.map(r => r.forecast_value !== null ? Number(r.forecast_value) : null);
  const observedData = sortedRecords.map(r => r.observed_value !== null ? Number(r.observed_value) : null);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm mb-6">
      <div className="border-b border-gray-100 px-4 py-3 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-800">{parameter}</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        <div className="lg:col-span-8 p-4">
          <ValidationChart 
            title={parameter} 
            unit={unit} 
            dates={dates} 
            forecastData={forecastData} 
            observedData={observedData} 
            parameter={parameter}
          />
        </div>
        
        <div className="lg:col-span-4 bg-gray-50/30">
          <div className="h-87.5 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100/90 backdrop-blur z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Abs. Error</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-gray-500">% Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{formatDate(record.date)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 font-mono whitespace-nowrap">
                      {formatNumber(record.absolute_error)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 font-mono whitespace-nowrap">
                      {formatNumber(record.percent_error, "%")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationParameterCard;
