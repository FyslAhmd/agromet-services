import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parameterUnits, parameterLabels } from './historicalDataFetcherService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read local Highcharts file
let HIGHCHARTS_JS = '';
try {
  HIGHCHARTS_JS = fs.readFileSync(path.join(__dirname, 'lib', 'highcharts.min.js'), 'utf8');
  console.log('📊 Loaded local Highcharts library');
} catch (e) {
  console.warn('⚠️ Could not load local Highcharts, will use CDN');
}

// EXACT same colors as frontend HistoricalDataChart.jsx
const STATION_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#7c3aed", "#0ea5e9", "#22c55e"
];

/**
 * Build Highcharts options that EXACTLY match the frontend
 * @param {Object} stationData - { "Station1": [[ts, val], ...], "Station2": [...] }
 * @param {string} parameter - Parameter key
 * @param {string} dataAverage - Data average setting
 */
const buildChartOptions = (stationData, parameter, dataAverage = 'none') => {
  const stations = Object.keys(stationData);
  const title = parameterLabels[parameter] || parameter;
  const unit = parameterUnits[parameter] || '';
  
  // Check if rainfall (column chart) or other (areaspline)
  const isRainData = parameter === "rainfall";
  const chartType = isRainData ? "column" : "areaspline";

  // Calculate min/max across all stations
  let allValues = [];
  Object.values(stationData).forEach(data => {
    data.forEach(point => {
      if (typeof point[1] === 'number' && !isNaN(point[1])) {
        allValues.push(point[1]);
      }
    });
  });

  if (allValues.length === 0) {
    return null;
  }

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = Math.max(range * 0.05, 1);

  // Build series for each station - EXACT same as frontend
  const series = stations.map((station, index) => {
    const data = stationData[station].filter(
      point => Array.isArray(point) && point.length === 2 && 
               typeof point[0] === 'number' && typeof point[1] === 'number' &&
               !isNaN(point[0]) && !isNaN(point[1])
    );

    return {
      type: chartType,
      name: station,
      data: data,
      color: STATION_COLORS[index % STATION_COLORS.length],
      lineWidth: isRainData ? 0 : 2,
      marker: {
        enabled: data.length <= 50,
        radius: data.length > 100 ? 0 : 4,
      },
    };
  }).filter(s => s.data.length > 0);

  if (series.length === 0) {
    return null;
  }

  // EXACT same chart options as frontend
  return {
    chart: {
      type: chartType,
      backgroundColor: "#ffffff",
      height: 500,
      width: 1400,
      animation: false,
      style: { fontFamily: 'Arial, sans-serif' },
    },
    title: {
      text: `${title} Comparison${dataAverage !== "none" ? ` (${dataAverage} Average)` : ""}`,
      align: "left",
      style: { fontSize: "18px", fontWeight: "bold", color: "#374151" },
    },
    subtitle: {
      text: `${stations.length} Station${stations.length > 1 ? 's' : ''} | ${unit}${dataAverage !== "none" ? ` | Averaged by ${dataAverage}` : ""}`,
      align: "left",
      style: { color: "#6B7280", fontSize: "13px" },
    },
    xAxis: {
      type: "datetime",
      gridLineColor: "rgba(0, 0, 0, 0.08)",
      gridLineDashStyle: "Dash",
      labels: {
        style: { fontSize: "11px", color: "#6B7280" },
        format: "{value:%b %Y}",
      },
      lineColor: "#E5E7EB",
    },
    yAxis: {
      title: { text: unit, style: { fontSize: "12px", fontWeight: "600", color: "#374151" } },
      gridLineColor: "rgba(0, 0, 0, 0.08)",
      gridLineDashStyle: "Dash",
      min: Math.max(0, minValue - padding),
      max: maxValue + padding,
      labels: { style: { fontSize: "11px", color: "#6B7280" } },
    },
    tooltip: {
      shared: true,
      crosshairs: true,
    },
    legend: {
      enabled: true,
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      itemStyle: { fontSize: "12px", fontWeight: "500", color: "#374151" },
      symbolRadius: 6,
    },
    plotOptions: {
      areaspline: {
        lineWidth: 2.5,
        fillOpacity: 0.08,
        marker: { radius: 3, lineWidth: 1, lineColor: "#ffffff" },
        connectNulls: true,
      },
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        groupPadding: 0.1,
      },
    },
    series: series,
    credits: { enabled: false },
    exporting: { enabled: false },
  };
};

/**
 * Generate chart image using Puppeteer + Highcharts
 * Creates a chart that looks EXACTLY like the frontend
 */
export const generateChartImage = async (stationData, parameter, dataAverage, outputPath) => {
  const chartOptions = buildChartOptions(stationData, parameter, dataAverage);
  
  if (!chartOptions) {
    console.log(`⚠️ No valid chart options for ${parameter}`);
    return null;
  }

  let browser = null;
  
  try {
    console.log(`🎨 Generating chart for ${parameterLabels[parameter] || parameter}...`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-file-access-from-files'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 700 });

    // Capture console logs for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  📋 Browser console error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`  📋 Page error: ${error.message}`);
    });

    // HTML page with Highcharts embedded directly (no CDN dependency)
    const highchartsScript = HIGHCHARTS_JS 
      ? `<script>${HIGHCHARTS_JS}</script>`
      : `<script src="https://code.highcharts.com/highcharts.js"></script>`;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #ffffff; 
      font-family: Arial, sans-serif;
    }
    #container { 
      width: 1400px; 
      height: 500px;
      background: #ffffff;
    }
    #error {
      display: none;
      color: red;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <div id="error"></div>
  
  <script>
    window.chartReady = false;
    window.chartError = null;
  </script>
  
  ${highchartsScript}
  
  <script>
    try {
      if (typeof Highcharts === 'undefined') {
        throw new Error('Highcharts not loaded');
      }
      
      const chartOptions = ${JSON.stringify(chartOptions)};
      
      // Create the chart
      Highcharts.chart('container', chartOptions, function(chart) {
        window.chartReady = true;
        console.log('Chart rendered successfully');
      });
      
    } catch (error) {
      window.chartError = error.message;
      document.getElementById('error').style.display = 'block';
      document.getElementById('error').textContent = 'Error: ' + error.message;
      console.error('Chart error:', error);
    }
  </script>
</body>
</html>`;

    // Navigate to blank page first, then set content
    await page.goto('about:blank');
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for chart to render with multiple strategies
    try {
      // Strategy 1: Wait for the SVG element
      await page.waitForSelector('#container svg', { timeout: 15000 });
    } catch (e) {
      // Strategy 2: Check if chart is ready via flag
      const isReady = await page.evaluate(() => window.chartReady);
      const chartError = await page.evaluate(() => window.chartError);
      
      if (chartError) {
        throw new Error(`Chart rendering failed: ${chartError}`);
      }
      
      if (!isReady) {
        // Strategy 3: Just wait a bit and check for any SVG
        await new Promise(resolve => setTimeout(resolve, 3000));
        const hasSvg = await page.evaluate(() => document.querySelector('#container svg') !== null);
        if (!hasSvg) {
          throw new Error('Chart SVG not found after waiting');
        }
      }
    }

    // Additional wait for animations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot of the container
    const chartElement = await page.$('#container');
    if (chartElement) {
      await chartElement.screenshot({ 
        path: outputPath,
        type: 'png',
        omitBackground: false
      });
      console.log(`✅ Chart saved: ${path.basename(outputPath)}`);
      return outputPath;
    } else {
      throw new Error('Container element not found');
    }

  } catch (error) {
    console.error(`❌ Error generating chart for ${parameter}:`, error.message);
    
    // Try to take a full page screenshot for debugging
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const debugPath = outputPath.replace('.png', '_debug.png');
          await pages[0].screenshot({ path: debugPath, fullPage: true });
          console.log(`  📸 Debug screenshot saved: ${path.basename(debugPath)}`);
        }
      } catch (e) {
        // Ignore debug screenshot errors
      }
    }
    
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Generate multiple chart images for all parameters
 * Each parameter gets ONE chart with ALL stations as multiple lines
 */
export const generateMultipleCharts = async (allData, dataAverage, tempDir) => {
  console.log('\n🎨 Step 2: Generating chart images...\n');
  
  const generatedImages = [];
  const parameters = Object.keys(allData);
  
  for (const parameter of parameters) {
    const stationData = allData[parameter];
    
    // Check if any station has data for this parameter
    const hasData = Object.values(stationData).some(data => data.length > 0);
    if (!hasData) {
      console.log(`⏭️  Skipping ${parameter}: No data available`);
      continue;
    }

    // Filter out stations with no data for cleaner charts
    const filteredStationData = {};
    for (const [station, data] of Object.entries(stationData)) {
      if (data && data.length > 0) {
        filteredStationData[station] = data;
      }
    }

    // Generate filename
    const safeParamName = (parameterLabels[parameter] || parameter).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeParamName}_chart.png`;
    const outputPath = path.join(tempDir, filename);

    const result = await generateChartImage(filteredStationData, parameter, dataAverage, outputPath);
    if (result) {
      generatedImages.push(result);
    }
  }

  console.log(`\n✅ Generated ${generatedImages.length} chart image(s)\n`);
  return generatedImages;
};

export { STATION_COLORS, buildChartOptions };
