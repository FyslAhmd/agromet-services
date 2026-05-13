import React, { useMemo } from 'react';
import ValidationParameterCard from './ValidationParameterCard';

const PARAMETER_ORDER = [
  "Max Temperature",
  "Min Temperature",
  "Average Temperature",
  "Rainfall",
  "Relative Humidity",
  "Wind Speed",
  "Wind Direction",
  "Solar Radiation",
  "Sunshine Hour",
];

const ForecastValidationGraphView = ({ records }) => {
  const groupedRecords = useMemo(() => {
    const groups = {};
    records.forEach(record => {
      if (!groups[record.parameter]) {
        groups[record.parameter] = {
          parameter: record.parameter,
          unit: record.unit,
          records: []
        };
      }
      groups[record.parameter].records.push(record);
    });

    return Object.values(groups).sort((a, b) => {
      const indexA = PARAMETER_ORDER.indexOf(a.parameter);
      const indexB = PARAMETER_ORDER.indexOf(b.parameter);
      if (indexA === -1 && indexB === -1) return a.parameter.localeCompare(b.parameter);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [records]);

  if (!records || records.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-gray-700">No validation data is available yet.</p>
          <p className="mt-2 text-xs text-gray-500">
            A scheduled or manual run will populate these charts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {groupedRecords.map(group => (
        <ValidationParameterCard 
          key={group.parameter} 
          parameter={group.parameter} 
          unit={group.unit} 
          records={group.records} 
        />
      ))}
    </div>
  );
};

export default ForecastValidationGraphView;
