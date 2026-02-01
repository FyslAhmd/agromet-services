// Data parameters configuration
export const dataParameters = [
  { value: "maximum-temp", label: "Maximum Temperature (°C)", color: "#ef4444", icon: "🌡️" },
  { value: "minimum-temp", label: "Minimum Temperature (°C)", color: "#3b82f6", icon: "❄️" },
  { value: "rainfall", label: "Rainfall (mm)", color: "#06b6d4", icon: "🌧️" },
  { value: "relative-humidity", label: "Relative Humidity (%)", color: "#8b5cf6", icon: "💧" },
  { value: "sunshine", label: "Sunshine (hrs)", color: "#f59e0b", icon: "☀️" },
  { value: "wind-speed", label: "Wind Speed (m/s)", color: "#10b981", icon: "💨" },
  { value: "soil-moisture", label: "Soil Moisture (%)", color: "#84cc16", icon: "🌱" },
  { value: "soil-temperature", label: "Soil Temperature (°C)", color: "#f97316", icon: "🌍" },
  { value: "average-temperature", label: "Average Temperature (°C)", color: "#ec4899", icon: "🌡️" },
  { value: "solar-radiation", label: "Solar Radiation (W/m²)", color: "#eab308", icon: "🔆" },
  { value: "evapo-transpiration", label: "Evapo Transpiration (mm)", color: "#14b8a6", icon: "💦" },
];

// Time intervals configuration
export const intervals = [
  { value: "1D", label: "1 Day" },
  { value: "1W", label: "1 Week" },
  { value: "1M", label: "1 Month" },
  { value: "3M", label: "3 Months" },
  { value: "6M", label: "6 Months" },
  { value: "1Y", label: "1 Year" },
  { value: "5Y", label: "5 Years" },
  { value: "10Y", label: "10 Years" },
  { value: "20Y", label: "20 Years" },
  { value: "30Y", label: "30 Years" },
  { value: "50Y", label: "50 Years" },
  { value: "All", label: "All Data" },
];

// Chart colors for datasets
export const chartColors = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#14b8a6", // teal
];

// Get chart options based on interval and parameter
export const getChartOptions = (dataInterval, selectedParameter, dataParameters) => {
  const paramInfo = dataParameters.find((p) => p.value === selectedParameter);
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        padding: 16,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 6,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit:
            dataInterval === "1D" ? "hour" :
            dataInterval === "1W" ? "day" :
            dataInterval === "1M" ? "day" :
            dataInterval === "3M" ? "week" :
            dataInterval === "6M" ? "week" :
            dataInterval === "1Y" ? "month" :
            ["5Y", "10Y"].includes(dataInterval) ? "month" :
            ["20Y", "30Y", "50Y", "All"].includes(dataInterval) ? "year" : "day",
          tooltipFormat: "MMM dd, yyyy",
          displayFormats: {
            hour: "HH:mm",
            day: "MMM dd",
            week: "MMM dd",
            month: "MMM yyyy",
            year: "yyyy",
          },
        },
        title: {
          display: true,
          text: "Date",
          font: {
            size: 13,
            weight: "bold",
          },
          color: "#94a3b8",
        },
        grid: {
          display: true,
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 12,
          font: {
            size: 11,
          },
          color: "#64748b",
        },
        border: {
          display: false,
        },
      },
      y: {
        title: {
          display: true,
          text: paramInfo?.label || "Value",
          font: {
            size: 13,
            weight: "bold",
          },
          color: "#94a3b8",
        },
        grid: {
          display: true,
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: "#64748b",
          padding: 8,
        },
        border: {
          display: false,
        },
        beginAtZero: true,
        min: 0,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.3,
      },
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 3,
      },
    },
  };
};
