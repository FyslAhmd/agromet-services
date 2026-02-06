import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fetchAllHistoricalData, parameterLabels } from './historicalDataFetcherService.js';
import { generateMultipleCharts } from './historicalChartGeneratorService.js';
import { generateMultipleCSVs, generateCombinedCSV } from './historicalCsvGeneratorService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate all files (charts and CSVs) for a historical data request
 * @param {Object} request - Historical data request object
 * @returns {Promise<Object>} Object containing generated file paths
 */
export const generateHistoricalFiles = async (request) => {
  const startTime = Date.now();
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`   HISTORICAL FILE GENERATION - Request ID: ${request.id}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📧 Email: ${request.email}`);
  console.log(`🏢 Stations: ${request.selectedStations?.length || 0}`);
  console.log(`📊 Parameters: ${request.selectedParameters?.length || 0}`);
  console.log(`📁 Formats: ${request.selectedDataFormats?.join(', ') || 'None'}`);
  console.log(`⏱️  Time Interval: ${request.timeInterval || 'Custom Range'}`);
  console.log(`📈 Data Average: ${request.dataAverage || 'None'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  let tempDir = null;

  try {
    // Create temporary directory for this request
    tempDir = path.join(__dirname, '..', '..', 'temp', 'historical', `request_${request.id}_${Date.now()}`);
    await fs.ensureDir(tempDir);
    console.log(`📁 Temporary directory created: ${tempDir}\n`);

    // Parse selected formats
    const selectedFormats = request.selectedDataFormats || [];
    const includeImages = selectedFormats.includes('Image');
    const includeCSV = selectedFormats.includes('CSV');

    if (!includeImages && !includeCSV) {
      console.log('⚠️  No file formats selected. Skipping file generation.');
      return {
        success: true,
        message: 'No files generated (no formats selected)',
        images: [],
        csvs: [],
        tempDir
      };
    }

    // Parse stations and parameters
    const stations = request.selectedStations || [];
    const parameters = request.selectedParameters || [];

    if (stations.length === 0 || parameters.length === 0) {
      console.log('⚠️  No stations or parameters selected.');
      return {
        success: false,
        message: 'No stations or parameters selected',
        images: [],
        csvs: [],
        tempDir
      };
    }

    // Step 1: Fetch all historical data
    // This now fetches ALL data and filters from MOST RECENT backwards
    console.log('📡 Step 1: Fetching historical data...\n');
    const allData = await fetchAllHistoricalData(
      stations,
      parameters,
      request.timeInterval,
      request.dataAverage || 'none',
      request.startDate,
      request.endDate
    );

    // Check if we got any data
    let totalDataPoints = 0;
    let parametersWithData = 0;
    
    for (const [param, stationData] of Object.entries(allData)) {
      const hasData = Object.values(stationData).some(data => data.length > 0);
      if (hasData) {
        parametersWithData++;
        Object.values(stationData).forEach(data => {
          totalDataPoints += data.length;
        });
      }
    }

    console.log(`📊 Data summary: ${parametersWithData}/${parameters.length} parameters have data`);
    console.log(`📊 Total data points: ${totalDataPoints}`);

    if (totalDataPoints === 0) {
      console.log('⚠️  No data available for the requested combination.');
      return {
        success: false,
        message: 'No data available for the requested stations/parameters/date range',
        images: [],
        csvs: [],
        tempDir
      };
    }

    // Step 2: Generate chart images (if requested)
    let generatedImages = [];
    if (includeImages) {
      generatedImages = await generateMultipleCharts(
        allData, 
        request.dataAverage || 'none', 
        tempDir
      );
    } else {
      console.log('⏭️  Skipping image generation (not requested)');
    }

    // Step 3: Generate CSV files (if requested)
    let generatedCSVs = [];
    if (includeCSV) {
      generatedCSVs = await generateMultipleCSVs(allData, tempDir);
      
      // Also generate combined CSV for comprehensive analysis
      const combinedPath = path.join(tempDir, 'Historical_Data_Combined.csv');
      const combinedResult = await generateCombinedCSV(allData, combinedPath);
      if (combinedResult) {
        generatedCSVs.push(combinedResult);
      }
    } else {
      console.log('⏭️  Skipping CSV generation (not requested)');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   FILE GENERATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📸 Images generated: ${generatedImages.length}`);
    console.log(`📄 CSVs generated: ${generatedCSVs.length}`);
    console.log(`⏱️  Total time: ${elapsed}s`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      success: true,
      message: 'Files generated successfully',
      images: generatedImages,
      csvs: generatedCSVs,
      tempDir,
      stats: {
        totalDataPoints,
        parametersWithData,
        imagesGenerated: generatedImages.length,
        csvsGenerated: generatedCSVs.length,
        timeElapsed: elapsed
      }
    };

  } catch (error) {
    console.error('❌ Error in file generation:', error);
    return {
      success: false,
      message: error.message,
      images: [],
      csvs: [],
      tempDir,
      error: error.message
    };
  }
};

/**
 * Cleanup temporary files after email is sent
 */
export const cleanupTempFiles = async (tempDir) => {
  try {
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
      console.log(`🗑️  Cleaned up temporary files: ${tempDir}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('⚠️  Error cleaning up temp files:', error.message);
    return false;
  }
};
