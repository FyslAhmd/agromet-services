import React, { useState, useEffect } from "react";
import axios from "axios";

const CISMonthlyChart = () => {
  const [chartOptions, setChartOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("monthly"); // 'daily', 'weekly', 'monthly'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refetchTrigger, setRefetchTrigger] = useState(0); // Trigger for refetching data
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalApproved: 0,
    totalRejected: 0,
  });

  // Highcharts dynamic loader states
  const [HC, setHC] = useState(null);
  const [HCReact, setHCReact] = useState(null);
  const [hcReady, setHcReady] = useState(false);

  // === DYNAMICALLY LOAD HIGHCHARTS + MODULES ===
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Import Highcharts and the React wrapper dynamically
        const HighchartsModule = await import("highcharts");
        const Highcharts = HighchartsModule?.default ?? HighchartsModule;

        const HighchartsReactModule = await import("highcharts-react-official");
        const HighchartsReact =
          HighchartsReactModule?.default ?? HighchartsReactModule;

        // Load modules
        const exporting = await import("highcharts/modules/exporting");
        const exportData = await import("highcharts/modules/export-data");

        // Register modules with Highcharts
        const applyModule = (mod) => {
          if (!mod) return;
          if (typeof mod.default === "function") mod.default(Highcharts);
          else if (typeof mod === "function") mod(Highcharts);
        };

        applyModule(exporting);
        applyModule(exportData);

        if (mounted) {
          setHC(Highcharts);
          setHCReact(() => HighchartsReact);
          setHcReady(true);
        }
      } catch (err) {
        console.error("Failed to load/register Highcharts modules:", err);
        if (mounted) {
          setHcReady(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // === FETCH DATA FROM API (only when HC is ready) ===
  useEffect(() => {
    if (!hcReady) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Build API URL with query parameters
        let apiUrl = `https://saads.brri.gov.bd/api/cis/stats?period=${timePeriod}`;
        
        if (startDate && endDate) {
          apiUrl += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const response = await axios.get(apiUrl);

        // Process the API response
        if (response.data?.success && Array.isArray(response.data.data)) {
          const apiData = response.data.data;
          
          const monthNames = {
            "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
            "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
            "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
          };

          const categories = [];
          const requestsData = [];
          const approvedData = [];
          const rejectedData = [];

          let totalReq = 0, totalApp = 0, totalRej = 0;

          apiData.forEach((item) => {
            let label = '';
            
            try {
              if (timePeriod === 'daily') {
                // Format: YYYY-MM-DD -> "DD MMM"
                const parts = item.period.split('-');
                if (parts.length >= 3) {
                  const [year, month, day] = parts;
                  // Pad month to ensure proper lookup
                  const monthPadded = month.padStart(2, '0');
                  const monthName = monthNames[monthPadded] || monthNames[month] || month;
                  label = `${parseInt(day)} ${monthName}`;
                } else {
                  label = item.period;
                }
              } else if (timePeriod === 'weekly') {
                // Format: YYYY-WW or YYYY-IW## -> Better date range format
                const parts = item.period.split('-');
                if (parts.length >= 2) {
                  const year = parts[0];
                  const weekStr = parts[1];
                  
                  // Extract week number - handle both "50", "IW50", "W50" formats
                  const weekNum = parseInt(weekStr.replace(/[^\d]/g, ''));
                  
                  if (!isNaN(weekNum) && weekNum > 0 && weekNum <= 53) {
                    // Calculate the start date of the week using ISO week date
                    const yearInt = parseInt(year);
                    const jan4 = new Date(yearInt, 0, 4);
                    const weekStart = new Date(jan4);
                    const dayOffset = (jan4.getDay() || 7) - 1; // Monday = 0
                    weekStart.setDate(jan4.getDate() - dayOffset + (weekNum - 1) * 7);
                    
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    
                    // Format: "1-7 Nov" or "25 Nov-1 Dec" if spans months
                    const startDay = weekStart.getDate();
                    const endDay = weekEnd.getDate();
                    const startMonth = weekStart.toLocaleString('en-US', { month: 'short' });
                    const endMonth = weekEnd.toLocaleString('en-US', { month: 'short' });
                    
                    if (startMonth === endMonth) {
                      label = `${startDay}-${endDay} ${startMonth}`;
                    } else {
                      label = `${startDay} ${startMonth}-${endDay} ${endMonth}`;
                    }
                  } else {
                    label = item.period;
                  }
                } else {
                  label = item.period;
                }
              } else {
                // Monthly format: YYYY-MM -> "MMM 'YY"
                const parts = item.period.split('-');
                if (parts.length >= 2) {
                  const [year, monthNum] = parts;
                  // Pad month to ensure proper lookup
                  const monthPadded = monthNum.padStart(2, '0');
                  const monthName = monthNames[monthPadded] || monthNames[monthNum] || monthNum;
                  const yearShort = year.slice(-2);
                  label = `${monthName} '${yearShort}`;
                } else {
                  label = item.period;
                }
              }
            } catch (error) {
              console.error('Error formatting period:', item.period, error);
              label = item.period || 'N/A';
            }

            categories.push(label);
            requestsData.push(item.total || 0);
            approvedData.push(item.approved || 0);
            rejectedData.push(item.rejected || 0);

            totalReq += item.total || 0;
            totalApp += item.approved || 0;
            totalRej += item.rejected || 0;
          });

          setStats({
            totalRequests: totalReq,
            totalApproved: totalApp,
            totalRejected: totalRej,
          });

          // Reverse arrays to show latest data on the left
          categories.reverse();
          requestsData.reverse();
          approvedData.reverse();
          rejectedData.reverse();

          // Create chart with real data
          createChart(categories, requestsData, approvedData, rejectedData);
        } else {
          // Fallback to demo data if API returns unexpected format
          console.warn('API returned unexpected format, using demo data');
          createDemoChart(timePeriod);
        }
      } catch (error) {
        console.error("Error fetching CIS monthly stats:", error);
        // Use demo data on error
        createDemoChart(timePeriod);
      } finally {
        setLoading(false);
      }
    };

    const createChart = (categories, requestsData, approvedData, rejectedData) => {
      const isMobile = window.innerWidth < 768;
      
      setChartOptions({
        chart: {
          type: "column",
          backgroundColor: "#ffffff",
          height: null,
        },
        title: {
          text: "",
          align: "left",
          style: {
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
          },
          margin: 20,
        },
        subtitle: {
          text: "",
          align: "left",
          style: {
            fontSize: "12px",
            color: "#6b7280",
          },
        },
        xAxis: {
          categories: categories,
          crosshair: {
            width: 2,
            color: "#e5e7eb",
            dashStyle: "Dash",
          },
          accessibility: {
            description:
              timePeriod === "daily"
                ? "Days"
                : timePeriod === "weekly"
                ? "Weeks"
                : "Months",
          },
          labels: {
            style: {
              fontSize: "10px",
              color: "#6b7280",
            },
            rotation: -45,
            align: "right",
          },
          lineColor: "#e5e7eb",
          tickColor: "#e5e7eb",
        },
        yAxis: {
          min: 0,
          title: {
            text: "Number of Requests",
            style: {
              fontSize: "11px",
              color: "#6b7280",
              fontWeight: "500",
            },
          },
          labels: {
            style: {
              fontSize: "10px",
              color: "#6b7280",
            },
          },
          gridLineColor: "#f3f4f6",
          gridLineDashStyle: "Dash",
        },
        tooltip: {
          shared: true,
          useHTML: true,
          backgroundColor: "#ffffff",
          borderColor: "#e5e7eb",
          borderRadius: 8,
          borderWidth: 1,
          padding: 12,
          shadow: {
            color: "rgba(0,0,0,0.1)",
            offsetX: 0,
            offsetY: 2,
            opacity: 0.1,
            width: 4,
          },
          style: {
            fontSize: "11px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          headerFormat:
            '<div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">{point.key}</div>',
          pointFormat:
            '<div style="display: flex; align-items: center; margin: 4px 0;"><span style="color:{point.color}; font-size: 16px; margin-right: 6px;">●</span><span style="color: #4b5563; flex: 1;">{series.name}:</span><span style="font-weight: 600; color: #1f2937; margin-left: 8px;">{point.y}</span></div>',
          footerFormat: "</div>",
        },
        plotOptions: {
          column: {
            pointPadding: 0.1,
            borderWidth: 0,
            borderRadius: 6,
            dataLabels: {
              enabled: false,
            },
            groupPadding: 0.15,
            shadow: false,
          },
        },
        legend: {
          align: "center",
          verticalAlign: "bottom",
          layout: "horizontal",
          itemStyle: {
            fontSize: "11px",
            fontWeight: "500",
            color: "#4b5563",
          },
          itemHoverStyle: {
            color: "#1f2937",
          },
          itemMarginBottom: 5,
          symbolRadius: 3,
          symbolHeight: 10,
          symbolWidth: 10,
          itemDistance: 20,
        },
        credits: {
          enabled: false,
        },
        exporting: {
          enabled: false,
        },
        responsive: {
          rules: [
            {
              condition: {
                maxWidth: 767,
              },
              chartOptions: {
                chart: {
                  height: 280,
                },
                legend: {
                  enabled: false,
                },
                title: {
                  style: {
                    fontSize: "13px",
                  },
                  margin: 15,
                },
                subtitle: {
                  text: null,
                },
                xAxis: {
                  labels: {
                    style: {
                      fontSize: "9px",
                    },
                    rotation: -45,
                  },
                },
                yAxis: {
                  title: {
                    text: "Requests",
                    style: {
                      fontSize: "10px",
                    },
                  },
                  labels: {
                    style: {
                      fontSize: "9px",
                    },
                  },
                },
                plotOptions: {
                  column: {
                    pointPadding: 0.05,
                    groupPadding: 0.1,
                  },
                },
              },
            },
          ],
        },
        series: [
          {
            name: "Total Requests",
            data: requestsData,
            color: "#3b82f6",
          },
          {
            name: "Approved",
            data: approvedData,
            color: "#10b981",
          },
          {
            name: "Rejected",
            data: rejectedData,
            color: "#ef4444",
          },
        ],
      });
    };

    const createDemoChart = (period) => {
      let categories = [];
      let requestsData = [];
      let approvedData = [];
      let rejectedData = [];
      let titleText = "";
      let subtitleText = "";

      // Check if mobile device
      const isMobile = window.innerWidth < 768;
      const dataPoints = isMobile ? 6 : 12;

      if (period === "daily") {
        // Last days (6 for mobile, 12 for desktop)
        const today = new Date();
        for (let i = dataPoints - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const day = date.getDate();
          const month = date.toLocaleString("en-US", { month: "short" });
          categories.push(`${day} ${month}`);
        }
        const allRequestsData = [23, 18, 25, 21, 28, 24, 30, 26, 22, 29, 27, 31];
        const allApprovedData = [18, 15, 20, 17, 22, 19, 24, 21, 18, 23, 21, 25];
        const allRejectedData = [5, 3, 5, 4, 6, 5, 6, 5, 4, 6, 6, 6];
        
        requestsData = allRequestsData.slice(-dataPoints);
        approvedData = allApprovedData.slice(-dataPoints);
        rejectedData = allRejectedData.slice(-dataPoints);
      } else if (period === "weekly") {
        // Last weeks (6 for mobile, 12 for desktop)
        const today = new Date();
        for (let i = dataPoints - 1; i >= 0; i--) {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - i * 7 - today.getDay() + 1); // Start from Monday
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const startDay = weekStart.getDate();
          const endDay = weekEnd.getDate();
          const startMonth = weekStart.toLocaleString("en-US", { month: "short" });
          const endMonth = weekEnd.toLocaleString("en-US", { month: "short" });
          
          if (startMonth === endMonth) {
            categories.push(`${startDay}-${endDay} ${startMonth}`);
          } else {
            categories.push(`${startDay} ${startMonth}-${endDay} ${endMonth}`);
          }
        }
        const allRequestsData = [
          145, 132, 158, 141, 168, 154, 172, 159, 148, 175, 163, 180,
        ];
        const allApprovedData = [
          118, 108, 128, 115, 138, 126, 142, 131, 122, 145, 135, 148,
        ];
        const allRejectedData = [27, 24, 30, 26, 30, 28, 30, 28, 26, 30, 28, 32];
        
        requestsData = allRequestsData.slice(-dataPoints);
        approvedData = allApprovedData.slice(-dataPoints);
        rejectedData = allRejectedData.slice(-dataPoints);
      } else {
        // Monthly (default) - Last months (6 for mobile, 12 for desktop)
        const allCategories = [
          "Jan '25",
          "Feb '25",
          "Mar '25",
          "Apr '25",
          "May '25",
          "Jun '25",
          "Jul '25",
          "Aug '25",
          "Sep '25",
          "Oct '25",
          "Nov '25",
          "Dec '25",
        ];
        const allRequestsData = [45, 52, 48, 61, 55, 58, 63, 59, 54, 67, 10, 5];
        const allApprovedData = [38, 45, 41, 53, 47, 50, 55, 51, 46, 58, 6, 3];
        const allRejectedData = [7, 7, 7, 8, 8, 8, 8, 8, 8, 9, 4, 2];
        
        categories = allCategories.slice(-dataPoints);
        requestsData = allRequestsData.slice(-dataPoints);
        approvedData = allApprovedData.slice(-dataPoints);
        rejectedData = allRejectedData.slice(-dataPoints);
      }

      setStats({
        totalRequests: requestsData.reduce((a, b) => a + b, 0),
        totalApproved: approvedData.reduce((a, b) => a + b, 0),
        totalRejected: rejectedData.reduce((a, b) => a + b, 0),
      });

      // Reverse arrays to show latest data on the left
      categories.reverse();
      requestsData.reverse();
      approvedData.reverse();
      rejectedData.reverse();

      setChartOptions({
        chart: {
          type: "column",
          backgroundColor: "#ffffff",
          height: null,
        },
        title: {
          text: titleText,
          align: "left",
          style: {
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
          },
          margin: 20,
        },
        subtitle: {
          text: subtitleText,
          align: "left",
          style: {
            fontSize: "12px",
            color: "#6b7280",
          },
        },
        xAxis: {
          categories: categories,
          crosshair: {
            width: 2,
            color: "#e5e7eb",
            dashStyle: "Dash",
          },
          accessibility: {
            description:
              period === "daily"
                ? "Days"
                : period === "weekly"
                ? "Weeks"
                : "Months",
          },
          labels: {
            style: {
              fontSize: "10px",
              color: "#6b7280",
            },
            rotation: -45,
            align: "right",
          },
          lineColor: "#e5e7eb",
          tickColor: "#e5e7eb",
        },
        yAxis: {
          min: 0,
          title: {
            text: "Number of Requests",
            style: {
              fontSize: "11px",
              color: "#6b7280",
              fontWeight: "500",
            },
          },
          labels: {
            style: {
              fontSize: "10px",
              color: "#6b7280",
            },
          },
          gridLineColor: "#f3f4f6",
          gridLineDashStyle: "Dash",
        },
        tooltip: {
          shared: true,
          useHTML: true,
          backgroundColor: "#ffffff",
          borderColor: "#e5e7eb",
          borderRadius: 8,
          borderWidth: 1,
          padding: 12,
          shadow: {
            color: "rgba(0,0,0,0.1)",
            offsetX: 0,
            offsetY: 2,
            opacity: 0.1,
            width: 4,
          },
          style: {
            fontSize: "11px",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
          headerFormat:
            '<div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #1f2937;">{point.key}</div>',
          pointFormat:
            '<div style="display: flex; align-items: center; margin: 4px 0;"><span style="color:{point.color}; font-size: 16px; margin-right: 6px;">●</span><span style="color: #4b5563; flex: 1;">{series.name}:</span><span style="font-weight: 600; color: #1f2937; margin-left: 8px;">{point.y}</span></div>',
          footerFormat: "</div>",
        },
        plotOptions: {
          column: {
            pointPadding: 0.1,
            borderWidth: 0,
            borderRadius: 6,
            dataLabels: {
              enabled: false,
            },
            groupPadding: 0.15,
            shadow: false,
          },
        },
        legend: {
          align: "center",
          verticalAlign: "bottom",
          layout: "horizontal",
          itemStyle: {
            fontSize: "11px",
            fontWeight: "500",
            color: "#4b5563",
          },
          itemHoverStyle: {
            color: "#1f2937",
          },
          itemMarginBottom: 5,
          symbolRadius: 3,
          symbolHeight: 10,
          symbolWidth: 10,
          itemDistance: 20,
        },
        credits: {
          enabled: false,
        },
        exporting: {
          enabled: false,
        },
        responsive: {
          rules: [
            {
              condition: {
                maxWidth: 767,
              },
              chartOptions: {
                chart: {
                  height: 280, // Reduced height for mobile
                },
                legend: {
                  enabled: false, // Hide default legend on mobile
                },
                title: {
                  style: {
                    fontSize: "13px",
                  },
                  margin: 15,
                },
                subtitle: {
                  text: null, // Hide subtitle on mobile
                },
                xAxis: {
                  labels: {
                    style: {
                      fontSize: "9px",
                    },
                    rotation: -45,
                  },
                },
                yAxis: {
                  title: {
                    text: "Requests",
                    style: {
                      fontSize: "10px",
                    },
                  },
                  labels: {
                    style: {
                      fontSize: "9px",
                    },
                  },
                },
                plotOptions: {
                  column: {
                    pointPadding: 0.05,
                    groupPadding: 0.1,
                  },
                },
              },
            },
          ],
        },
        series: [
          {
            name: "Total Requests",
            data: requestsData,
            color: "#3b82f6",
          },
          {
            name: "Approved",
            data: approvedData,
            color: "#10b981",
          },
          {
            name: "Rejected",
            data: rejectedData,
            color: "#ef4444",
          },
        ],
      });
    };

    fetchData();
  }, [hcReady, timePeriod, refetchTrigger]);

  const isBusy = loading || !hcReady;

  if (isBusy) {
    return (
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-start space-x-3 mb-4 md:mb-6">
            <div className="flex-1 min-w-0">
              <div className="h-5 md:h-6 bg-gray-200 rounded w-40 md:w-48 mb-2"></div>
              <div className="h-3 md:h-4 bg-gray-200 rounded w-48 md:w-64"></div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="h-6 md:h-8 bg-gray-200 rounded w-12 md:w-16 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16 md:w-20"></div>
            </div>
          </div>
          <div className="w-full h-60 md:h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
      {/* Header with Time Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            CIS Request Analytics
          </h3>
          <p className="text-sm text-gray-500">
            Track and analyze request trends over time
          </p>
        </div>

        {/* Time Period Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setTimePeriod("daily")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              timePeriod === "daily"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="hidden sm:inline">Daily</span>
            </div>
          </button>
          <button
            onClick={() => setTimePeriod("weekly")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              timePeriod === "weekly"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
              <span className="hidden sm:inline">Weekly</span>
            </div>
          </button>
          <button
            onClick={() => setTimePeriod("monthly")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              timePeriod === "monthly"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Monthly</span>
            </div>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
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
              From Date
            </div>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            placeholder="Start Date"
          />
        </div>

        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
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
              To Date
            </div>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            placeholder="End Date"
          />
        </div>

        <button
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!startDate || !endDate}
          onClick={() => {
            // Validate date range before applying
            if (!startDate || !endDate) {
              alert('Please select both start and end dates');
              return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
              alert('Start date cannot be after end date');
              return;
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (new Date(startDate) > today || new Date(endDate) > today) {
              alert('Dates cannot be in the future');
              return;
            }
            
            // Trigger refetch by updating the trigger
            setRefetchTrigger(prev => prev + 1);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="hidden sm:inline">Apply Filter</span>
          <span className="sm:hidden">Filter</span>
        </button>
      </div>

      {/* Highcharts Chart */}
      <div
        className="w-full bg-gray-50 rounded-lg p-2 sm:p-4 border border-gray-200"
        style={{ minHeight: "300px" }}
      >
        {HC && HCReact && chartOptions ? (
          <HCReact highcharts={HC} options={chartOptions} />
        ) : (
          <div className="flex justify-center items-center h-64 text-gray-400">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading chart...</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Legend - Simple version for mobile devices */}
      <div className="block md:hidden mt-3">
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
            <span className="text-gray-600">Total</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
            <span className="text-gray-600">Approved</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
            <span className="text-gray-600">Rejected</span>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 bg-blue-100 rounded-lg items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600"
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
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Total</p>
              <p className="text-base sm:text-xl font-bold text-gray-800">
                {stats.totalRequests}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 bg-green-100 rounded-lg items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600"
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
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Approved</p>
              <p className="text-base sm:text-xl font-bold text-gray-800">
                {stats.totalApproved}
              </p>
              <p className="text-[9px] sm:text-xs text-gray-400 hidden sm:block">
                {stats.totalRequests > 0
                  ? Math.round(
                      (stats.totalApproved / stats.totalRequests) * 100
                    )
                  : 0}
                % success
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
            <div className="hidden sm:flex w-10 h-10 bg-red-100 rounded-lg items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-600"
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
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">Rejected</p>
              <p className="text-base sm:text-xl font-bold text-gray-800">
                {stats.totalRejected}
              </p>
              <p className="text-[9px] sm:text-xs text-gray-400 hidden sm:block">
                {stats.totalRequests > 0
                  ? Math.round(
                      (stats.totalRejected / stats.totalRequests) * 100
                    )
                  : 0}
                % rejected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CISMonthlyChart;
