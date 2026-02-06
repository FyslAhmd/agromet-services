import fs from 'fs-extra';
import path from 'path';
import { parameterLabels, parameterUnits } from './historicalDataFetcherService.js';

/**
 * Generate CSV file for a single parameter with all stations
 * Matches the frontend CSV download format exactly
 * 
 * Format:
 * Date,Station1,Station2,Station3,...
 * 01/15/2024,25.5,26.1,24.8,...
 */
export const generateCSV = async (stationData, parameter, outputPath) => {
  try {
    const stations = Object.keys(stationData);
    
    // Check if any data exists
    const hasData = stations.some(station => stationData[station]?.length > 0);
    if (!hasData) {
      console.log(`⏭️  Skipping CSV for ${parameter}: No data`);
      return null;
    }

    // Header row
    const csvRows = [`Date,${stations.join(',')}`];

    // Get all unique timestamps across all stations
    const allTimestamps = new Set();
    Object.values(stationData).forEach(data => {
      if (Array.isArray(data)) {
        data.forEach(point => {
          if (Array.isArray(point) && point.length >= 1) {
            allTimestamps.add(point[0]);
          }
        });
      }
    });

    // Sort timestamps chronologically
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Build CSV rows
    sortedTimestamps.forEach(timestamp => {
      const date = new Date(timestamp).toLocaleDateString('en-US');
      const values = stations.map(station => {
        const data = stationData[station] || [];
        const point = data.find(p => p[0] === timestamp);
        return point ? point[1].toFixed(2) : "";
      });
      csvRows.push(`${date},${values.join(",")}`);
    });

    // Write to file
    const csvContent = csvRows.join("\n");
    await fs.writeFile(outputPath, csvContent, 'utf8');
    
    console.log(`✅ CSV saved: ${path.basename(outputPath)} (${sortedTimestamps.length} rows)`);
    return outputPath;

  } catch (error) {
    console.error(`❌ Error generating CSV for ${parameter}:`, error.message);
    return null;
  }
};

/**
 * Generate CSV files for all parameters
 * One CSV per parameter, with all stations as columns
 */
export const generateMultipleCSVs = async (allData, tempDir) => {
  console.log('\n📄 Step 3: Generating CSV files...\n');
  
  const generatedCSVs = [];
  const parameters = Object.keys(allData);

  for (const parameter of parameters) {
    const stationData = allData[parameter];
    
    // Check if any station has data
    const hasData = Object.values(stationData).some(data => data.length > 0);
    if (!hasData) {
      console.log(`⏭️  Skipping ${parameter}: No data available`);
      continue;
    }

    // Generate filename
    const safeParamName = (parameterLabels[parameter] || parameter).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeParamName}_data.csv`;
    const outputPath = path.join(tempDir, filename);

    const result = await generateCSV(stationData, parameter, outputPath);
    if (result) {
      generatedCSVs.push(result);
    }
  }

  console.log(`\n✅ Generated ${generatedCSVs.length} CSV file(s)\n`);
  return generatedCSVs;
};

/**
 * Generate a combined CSV with all parameters and stations
 * More comprehensive format for analysis
 * 
 * Format:
 * Date,Parameter,Station,Value,Unit
 */
export const generateCombinedCSV = async (allData, outputPath) => {
  try {
    const csvRows = ['Date,Parameter,Station,Value,Unit'];
    let rowCount = 0;

    for (const [parameter, stationData] of Object.entries(allData)) {
      const paramLabel = parameterLabels[parameter] || parameter;
      const unit = parameterUnits[parameter] || '';

      for (const [station, data] of Object.entries(stationData)) {
        if (!Array.isArray(data)) continue;

        for (const point of data) {
          if (!Array.isArray(point) || point.length < 2) continue;
          
          const date = new Date(point[0]).toLocaleDateString('en-US');
          const value = typeof point[1] === 'number' ? point[1].toFixed(2) : '';
          
          // Escape station name if it contains commas
          const safeStation = station.includes(',') ? `"${station}"` : station;
          
          csvRows.push(`${date},${paramLabel},${safeStation},${value},${unit}`);
          rowCount++;
        }
      }
    }

    if (rowCount === 0) {
      console.log('⏭️  No data for combined CSV');
      return null;
    }

    await fs.writeFile(outputPath, csvRows.join('\n'), 'utf8');
    console.log(`✅ Combined CSV saved: ${path.basename(outputPath)} (${rowCount} rows)`);
    return outputPath;

  } catch (error) {
    console.error('❌ Error generating combined CSV:', error.message);
    return null;
  }
};
