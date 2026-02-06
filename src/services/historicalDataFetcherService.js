import MaximumTemp from "../models/MaximumTemp.js";
import MinimumTemp from "../models/MinimumTemp.js";
import Rainfall from "../models/Rainfall.js";
import RelativeHumidity from "../models/RelativeHumidity.js";
import Sunshine from "../models/Sunshine.js";
import WindSpeed from "../models/WindSpeed.js";
import SoilMoisture from "../models/SoilMoisture.js";
import SoilTemperature from "../models/SoilTemperature.js";
import AverageTemperature from "../models/AverageTemperature.js";
import SolarRadiation from "../models/SolarRadiation.js";
import EvapoTranspiration from "../models/EvapoTranspiration.js";

// Map parameter names to models
const parameterModelMap = {
  'maximum-temp': MaximumTemp,
  'minimum-temp': MinimumTemp,
  'rainfall': Rainfall,
  'relative-humidity': RelativeHumidity,
  'sunshine': Sunshine,
  'wind-speed': WindSpeed,
  'soil-moisture': SoilMoisture,
  'soil-temperature': SoilTemperature,
  'average-temperature': AverageTemperature,
  'solar-radiation': SolarRadiation,
  'evapo-transpiration': EvapoTranspiration
};

// Parameter units for display
export const parameterUnits = {
  'maximum-temp': '°C',
  'minimum-temp': '°C',
  'rainfall': 'mm',
  'relative-humidity': '%',
  'sunshine': 'hrs',
  'wind-speed': 'm/s',
  'soil-moisture': '%',
  'soil-temperature': '°C',
  'average-temperature': '°C',
  'solar-radiation': 'W/m²',
  'evapo-transpiration': 'mm'
};

// Parameter labels for display
export const parameterLabels = {
  'maximum-temp': 'Maximum Temperature',
  'minimum-temp': 'Minimum Temperature',
  'rainfall': 'Rainfall',
  'relative-humidity': 'Relative Humidity',
  'sunshine': 'Sunshine Duration',
  'wind-speed': 'Wind Speed',
  'soil-moisture': 'Soil Moisture',
  'soil-temperature': 'Soil Temperature',
  'average-temperature': 'Average Temperature',
  'solar-radiation': 'Solar Radiation',
  'evapo-transpiration': 'Evapo-Transpiration'
};

/**
 * Process raw database records to chart format [timestamp, value]
 * Matches frontend processRawData function exactly
 */
const processRawData = (records) => {
  const chartData = [];
  records.forEach((record) => {
    for (let day = 1; day <= 31; day++) {
      const value = record[`day${day}`];
      if (value !== null && value !== undefined && value !== "") {
        const year = parseInt(record.year);
        const month = parseInt(record.month);
        const date = new Date(year, month - 1, day);
        // Validate that the date is valid (e.g., Feb 30 would shift to Mar 2)
        if (date.getDate() === day && date.getMonth() === month - 1) {
          chartData.push([date.getTime(), parseFloat(value)]);
        }
      }
    }
  });
  return chartData.sort((a, b) => a[0] - b[0]);
};

/**
 * Filter data by time range - FROM MOST RECENT DATA BACKWARDS
 * This matches the frontend logic exactly
 */
const filterDataByTimeRange = (fullData, timeInterval, customStartDate = null, customEndDate = null) => {
  if (!fullData || fullData.length === 0) return [];

  // Handle custom date range
  if (customStartDate && customEndDate) {
    const startTime = new Date(customStartDate).getTime();
    const endTime = new Date(customEndDate).setHours(23, 59, 59, 999);
    return fullData.filter((point) => point[0] >= startTime && point[0] <= endTime);
  }

  // Return all data if "All" is selected
  if (timeInterval === "All") return fullData;

  // Get the most recent timestamp from the data (not current date!)
  const mostRecentTimestamp = fullData[fullData.length - 1][0];
  const mostRecentDate = new Date(mostRecentTimestamp);

  const intervalDays = {
    "1D": 1,
    "1W": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825,
    "10Y": 3650,
    "20Y": 7300,
    "30Y": 10950,
    "50Y": 18250,
    "All": Infinity,
  };

  const daysBack = intervalDays[timeInterval] || 90;
  const startDate = new Date(mostRecentDate);
  startDate.setDate(startDate.getDate() - daysBack);

  return fullData.filter((point) => point[0] >= startDate.getTime());
};

/**
 * Aggregate data by interval (for Data Average feature)
 * Matches frontend aggregateDataByInterval exactly
 */
const aggregateDataByInterval = (data, interval) => {
  if (!data || data.length === 0 || interval === "none") return data;

  const intervalMonths = {
    "1M": 1,
    "3M": 3,
    "6M": 6,
    "1Y": 12,
    "5Y": 60,
    "10Y": 120,
    "20Y": 240,
    "30Y": 360,
  };

  // Handle weekly aggregation separately
  if (interval === "1W") {
    const sortedData = [...data].sort((a, b) => a[0] - b[0]);
    if (sortedData.length === 0) return [];

    const buckets = new Map();
    sortedData.forEach((point) => {
      const date = new Date(point[0]);
      // Get week number (ISO week)
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
      const weekNum = Math.floor(dayOfYear / 7);
      const bucketKey = `${date.getFullYear()}-W${weekNum}`;

      if (!buckets.has(bucketKey)) {
        // Center of the week
        const weekStart = new Date(date.getFullYear(), 0, 1 + weekNum * 7);
        const centerDate = new Date(weekStart.getTime() + 3.5 * 24 * 60 * 60 * 1000);
        buckets.set(bucketKey, {
          sum: 0,
          count: 0,
          timestamp: centerDate.getTime(),
        });
      }

      const bucket = buckets.get(bucketKey);
      bucket.sum += point[1];
      bucket.count += 1;
    });

    return Array.from(buckets.values())
      .map((bucket) => [bucket.timestamp, bucket.sum / bucket.count])
      .sort((a, b) => a[0] - b[0]);
  }

  const months = intervalMonths[interval];
  if (!months) return data;

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a[0] - b[0]);
  if (sortedData.length === 0) return [];

  // Group data by interval buckets
  const buckets = new Map();

  sortedData.forEach((point) => {
    const date = new Date(point[0]);
    const year = date.getFullYear();
    const month = date.getMonth();

    let bucketKey;
    if (months < 12) {
      // Sub-yearly intervals (6M)
      const bucketIndex = Math.floor(month / months);
      bucketKey = `${year}-${bucketIndex}`;
    } else {
      // Yearly or multi-year intervals
      const yearsPerBucket = months / 12;
      const bucketYear = Math.floor(year / yearsPerBucket) * yearsPerBucket;
      bucketKey = `${bucketYear}`;
    }

    if (!buckets.has(bucketKey)) {
      // Calculate the center timestamp for this bucket
      let centerDate;
      if (months < 12) {
        const bucketIndex = Math.floor(month / months);
        const startMonth = bucketIndex * months;
        const centerMonth = startMonth + Math.floor(months / 2);
        centerDate = new Date(year, centerMonth, 15);
      } else {
        const yearsPerBucket = months / 12;
        const bucketYear = Math.floor(year / yearsPerBucket) * yearsPerBucket;
        const centerYear = bucketYear + Math.floor(yearsPerBucket / 2);
        centerDate = new Date(centerYear, 6, 1); // Middle of center year
      }

      buckets.set(bucketKey, {
        sum: 0,
        count: 0,
        timestamp: centerDate.getTime(),
      });
    }

    const bucket = buckets.get(bucketKey);
    bucket.sum += point[1];
    bucket.count += 1;
  });

  return Array.from(buckets.values())
    .map((bucket) => [bucket.timestamp, bucket.sum / bucket.count])
    .sort((a, b) => a[0] - b[0]);
};

/**
 * Fetch ALL historical data for a specific station and parameter
 * Then filter and aggregate based on settings
 */
export const fetchHistoricalData = async (station, parameter, timeInterval, dataAverage = 'none', customStartDate = null, customEndDate = null) => {
  try {
    console.log(`📡 Fetching historical data for Station: ${station}, Parameter: ${parameter}`);
    
    const Model = parameterModelMap[parameter];
    if (!Model) {
      throw new Error(`Unknown parameter: ${parameter}`);
    }

    // Fetch ALL data for this station (matches frontend: limit=10000)
    const records = await Model.findAll({
      where: { station: station },
      order: [['year', 'ASC'], ['month', 'ASC']],
      raw: true
    });

    console.log(`📊 Found ${records.length} monthly records`);

    if (records.length === 0) {
      return [];
    }

    // Process raw data to [timestamp, value] format
    let chartData = processRawData(records);
    console.log(`✅ Extracted ${chartData.length} daily data points`);

    if (chartData.length === 0) {
      return [];
    }

    // Filter by time range (FROM MOST RECENT DATA, not current date)
    chartData = filterDataByTimeRange(chartData, timeInterval, customStartDate, customEndDate);
    console.log(`📅 After time filter: ${chartData.length} data points`);

    // Apply data averaging if requested
    if (dataAverage && dataAverage !== 'none') {
      chartData = aggregateDataByInterval(chartData, dataAverage);
      console.log(`📈 After ${dataAverage} averaging: ${chartData.length} data points`);
    }

    return chartData;

  } catch (error) {
    console.error(`❌ Error fetching data for ${station}/${parameter}:`, error.message);
    throw error;
  }
};

/**
 * Fetch data for multiple stations for a single parameter
 * Returns object keyed by station name: { "Station1": [[ts, val], ...], "Station2": [...] }
 */
export const fetchMultiStationData = async (stations, parameter, timeInterval, dataAverage = 'none', customStartDate = null, customEndDate = null) => {
  console.log(`\n📊 Fetching ${parameter} data for ${stations.length} stations...`);
  
  const result = {};
  
  for (const station of stations) {
    try {
      const data = await fetchHistoricalData(station, parameter, timeInterval, dataAverage, customStartDate, customEndDate);
      result[station] = data;
    } catch (error) {
      console.error(`❌ Failed to fetch data for ${station}:`, error.message);
      result[station] = [];
    }
  }

  const stationsWithData = Object.entries(result).filter(([_, data]) => data.length > 0).length;
  console.log(`✅ ${stationsWithData}/${stations.length} stations have data for ${parameter}`);

  return result;
};

/**
 * Fetch data for all stations and all parameters
 * Returns nested object: { parameter: { station: [[ts, val], ...] } }
 */
export const fetchAllHistoricalData = async (stations, parameters, timeInterval, dataAverage = 'none', customStartDate = null, customEndDate = null) => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   HISTORICAL DATA FETCH - STARTING');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🏢 Stations: ${stations.join(', ')}`);
  console.log(`📊 Parameters: ${parameters.join(', ')}`);
  console.log(`⏱️  Time Interval: ${timeInterval || 'Custom Range'}`);
  console.log(`📈 Data Average: ${dataAverage || 'None'}`);
  if (customStartDate && customEndDate) {
    console.log(`📅 Custom Range: ${customStartDate} to ${customEndDate}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  const result = {};
  let totalWithData = 0;
  let totalCombinations = parameters.length;

  for (const parameter of parameters) {
    const stationData = await fetchMultiStationData(
      stations,
      parameter,
      timeInterval,
      dataAverage,
      customStartDate,
      customEndDate
    );
    
    result[parameter] = stationData;
    
    // Check if any station has data for this parameter
    const hasData = Object.values(stationData).some(data => data.length > 0);
    if (hasData) totalWithData++;
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`   FETCH COMPLETE: ${totalWithData}/${totalCombinations} parameters have data`);
  console.log('═══════════════════════════════════════════════════════════\n');

  return result;
};

export { parameterModelMap };
