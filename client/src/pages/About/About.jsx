import React from "react";

const About = () => {
  const patrons = [
    {
      title: "Chief Patron",
      name: "Dr. Md Rafiqul Islam",
      designation: "Director (Research), BRRI",
      image: "/brri-da.jpg",
    },
    {
      title: "Patron",
      name: "Dr. ABM Zahid Hossain",
      designation: "SSO, IWM Division",
      image: "/zahid.jpg",
    },
  ];

  const features = [
    {
      icon: (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
          />
        </svg>
      ),
      title: "Automated Weather Stations (AWS)",
      desc: "Real-time weather monitoring from multiple BRRI research stations across Bangladesh.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Historical Climate Data",
      desc: "Access to decades of temperature, rainfall, humidity, sunshine, and other climate parameters.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
          />
        </svg>
      ),
      title: "Secondary Data Sources",
      desc: "Comprehensive rice statistics including seasonal production, varietal data, and district-wise analytics.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: "Data Request System",
      desc: "Structured process for researchers and stakeholders to request customized climate and rice data.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Interactive Visualizations",
      desc: "Dynamic charts and graphs for easy interpretation of weather trends and agricultural statistics.",
    },
    {
      icon: (
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Weather Forecasts",
      desc: "Integration with weather forecasting services for agricultural planning.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Header */}
      <div className="bg-linear-to-br from-[#0a3d3d] via-[#0d4a4a] to-[#083535] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-medium text-teal-100">
                Bangladesh Rice Research Institute
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4 md:mb-6">
              BRRI Agromet Services Portal
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-teal-100/90 leading-relaxed max-w-2xl mx-auto px-2">
              A comprehensive digital platform empowering farmers, researchers,
              and agricultural stakeholders with real-time weather data, climate
              analytics, and rice-related statistics.
            </p>
          </div>
        </div>
        {/* Wave divider */}
        <div
          className="h-6 sm:h-8 md:h-12 bg-gray-50/50"
          style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8">
        {/* About Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                About the Portal
              </h2>
            </div>

            <div className="space-y-4 sm:space-y-5 text-sm sm:text-base text-gray-600 leading-relaxed">
              <p className="text-justify">
                Bangladesh's agriculture is highly dependent on weather and
                climate conditions. Rice, being the staple food and primary
                crop, requires precise management of planting schedules,
                irrigation, and pest control—all of which are significantly
                influenced by weather patterns. The BRRI Agromet Services Portal
                addresses these challenges by providing accessible, accurate,
                and timely agrometeorological information.
              </p>
              <p className="text-justify">
                Developed by the Agromet Lab at Bangladesh Rice Research
                Institute (BRRI), this portal consolidates data from multiple
                Automated Weather Stations (AWS) deployed across BRRI research
                stations nationwide. It provides real-time monitoring of
                critical weather parameters including temperature, rainfall,
                humidity, solar radiation, wind speed, and soil conditions.
              </p>
              <p className="text-justify">
                Beyond real-time data, the platform offers access to decades of
                historical climate data, enabling trend analysis and climate
                change research. The secondary data section provides
                comprehensive rice-related statistics including seasonal
                production data, varietal adoption rates, district-wise
                analytics, and cropping intensity information—essential for
                agricultural planning and policy formulation.
              </p>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 sm:px-6 md:px-8 lg:px-10 pt-5 sm:pt-6 md:pt-8 lg:pt-10 pb-2 sm:pb-3">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Key Features
              </h2>
            </div>
          </div>
          <div className="px-5 sm:px-6 md:px-8 lg:px-10 pb-5 sm:pb-6 md:pb-8 lg:pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group p-3.5 sm:p-4 md:p-5 rounded-xl border border-gray-100 hover:border-teal-200 bg-gray-50/50 hover:bg-teal-50/50 transition-all duration-200"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0d4a4a]/10 text-[#0d4a4a] flex items-center justify-center mb-2.5 sm:mb-3 group-hover:bg-[#0d4a4a] group-hover:text-white transition-colors duration-200">
                    {feature.icon}
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-linear-to-br from-[#0a3d3d] to-[#0d5555] rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                Our Mission
              </h2>
            </div>
            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed text-justify">
              To bridge the gap between agricultural research and farming
              communities by providing accessible, reliable, and actionable
              agrometeorological information. We aim to support climate-smart
              rice cultivation practices, enhance food security, and contribute
              to the sustainable development of Bangladesh's agricultural
              sector.
            </p>
          </div>
        </div>

        {/* Patrons Section */}
        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Patrons
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto">
              {patrons.map((patron, index) => (
                <div key={index} className="text-center group">
                  <span className="inline-block text-xs sm:text-sm font-semibold text-[#0d4a4a] bg-teal-50 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 mb-3 sm:mb-4">
                    {patron.title}
                  </span>
                  <div className="relative overflow-hidden rounded-xl mx-auto w-44 h-52 sm:w-52 sm:h-60 md:w-56 md:h-64 mb-3 sm:mb-4 ring-2 ring-gray-100 group-hover:ring-teal-200 transition-all duration-300">
                    <img
                      src={patron.image}
                      alt={patron.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#0d4a4a] transition-colors">
                    {patron.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {patron.designation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Plan, Database & Execution Section */}
        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Plan, Database & Execution By
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 md:gap-8 max-w-2xl mx-auto p-4 sm:p-5 md:p-6 rounded-xl bg-gray-50/80 border border-gray-100">
              <div className="relative overflow-hidden rounded-xl shrink-0 w-40 h-48 sm:w-44 sm:h-52 md:w-52 md:h-60 ring-2 ring-gray-100">
                <img
                  src="/niaz.jpg"
                  alt="Niaz Md. Farhat Rahman"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center sm:text-left space-y-2 sm:space-y-3 flex-1 min-w-0">
                <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                  Niaz Md. Farhat Rahman
                </h4>
                <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-gray-500">
                  <p>Principal Scientific Officer</p>
                  <p>Agricultural Statistics Division</p>
                  <p>& Member, Agromet Lab</p>
                  <p>Bangladesh Rice Research Institute (BRRI)</p>
                  <p>Gazipur-1701, Bangladesh.</p>
                </div>
                <div className="pt-2 sm:pt-3 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:niaz.sust@gmail.com"
                      className="text-[#0d4a4a] hover:underline truncate"
                    >
                      niaz.sust@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-gray-600">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>+8801912700606</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-gray-600">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-xs">
                      PABX 880-2-49272005-14 Ext. 395
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Development Team Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Development Team
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 md:gap-8 max-w-5xl mx-auto">
              <div className="text-center group p-4 sm:p-5 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-teal-200 transition-all duration-200">
                <div className="relative overflow-hidden rounded-xl mx-auto w-40 h-48 sm:w-48 sm:h-56 md:w-52 md:h-60 mb-3 sm:mb-4 ring-2 ring-gray-100 group-hover:ring-teal-200 transition-all duration-300">
                  <img
                    src="/niaz.jpg"
                    alt="Riyad Ali Mollik"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#0d4a4a] transition-colors">
                  Dr. Niaz Md. Farhat Rahman
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-3">
                  Principal Scientific Officer & Member, Agromet Lab, BRRI
                </p>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:niaz.sust@gmail.com"
                      className="text-[#0d4a4a] hover:underline truncate"
                    >
                      niaz.sust@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>+8801912700606</span>
                  </div>
                </div>
              </div>

              {/* Fullstack Developer */}
              <div className="text-center group p-4 sm:p-5 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-teal-200 transition-all duration-200">
                <div className="relative overflow-hidden rounded-xl mx-auto w-40 h-48 sm:w-48 sm:h-56 md:w-52 md:h-60 mb-3 sm:mb-4 ring-2 ring-gray-100 group-hover:ring-teal-200 transition-all duration-300">
                  <img
                    src="/riyad.jpg"
                    alt="Riyad Ali Mollik"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#0d4a4a] transition-colors">
                  Riyad Ali Mollik
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-3">
                  Fullstack Developer
                </p>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:mollikmdriyadh@gmail.com"
                      className="text-[#0d4a4a] hover:underline truncate"
                    >
                      mollikmdriyadh@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>+8801786563606</span>
                  </div>
                </div>
              </div>

              {/* Frontend Developer */}
              <div className="text-center group p-4 sm:p-5 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-teal-200 transition-all duration-200">
                <div className="relative overflow-hidden rounded-xl mx-auto w-40 h-48 sm:w-48 sm:h-56 md:w-52 md:h-60 mb-3 sm:mb-4 ring-2 ring-gray-100 group-hover:ring-teal-200 transition-all duration-300">
                  <img
                    src="/faysal.JPG"
                    alt="Faysal Ahmad Patwary"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#0d4a4a] transition-colors">
                  Faysal Ahmad Patwary
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-3">
                  Frontend Developer & Designer
                </p>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:info.faysal.32@gmail.com"
                      className="text-[#0d4a4a] hover:underline truncate"
                    >
                      info.faysal.32@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0d4a4a] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>+8801615553632</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0d4a4a]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0d4a4a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    Address
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Agromet Lab, Bangladesh Rice Research Institute (BRRI),
                    Gazipur-1701, Bangladesh
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0d4a4a]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0d4a4a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    Email
                  </p>
                  <a
                    href="mailto:info.brriagromet@gmail.com"
                    className="text-xs sm:text-sm text-[#0d4a4a] hover:underline mt-0.5 block truncate"
                  >
                    info.brriagromet@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0d4a4a]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0d4a4a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    Call Center Helpline
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    09644300300
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#0d4a4a]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0d4a4a]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                    Website
                  </p>
                  <a
                    href="https://brri.gov.bd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-[#0d4a4a] hover:underline mt-0.5 block truncate"
                  >
                    https://brri.gov.bd
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
