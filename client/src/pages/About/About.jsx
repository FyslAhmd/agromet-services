import React from "react";

const About = () => {
  const patrons = [
    {
      title: "Chief Patron",
      name: "Dr. Mohammad Khalequzzaman",
      designation: "Director General, BRRI",
      image: "/brri-dg-2.jpeg",
    },
    {
      title: "Patron",
      name: "Dr. Md Rafiqul Islam",
      designation: "Director (Research), BRRI",
      image: "/brri-da.jpg",
    },
  ];

  const reviewers = [
    {
      name: "Dr. ABM Zahid Hossain",
      designationLine1: "SSO, IWM Division",
      designationLine2: "& Laboratory Coordinator, Agromet Lab, BRRI",
      image: "/zahid.jpg",
    },
  ];

  return (
    <div className="min-h-screen max-w-full bg-base-200 flex flex-col items-center justify-center p-4 md:p-6">
      {/* Main Content Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 w-full max-w-6xl">
        <h1 className="text-xl md:text-3xl font-bold text-primary text-center mb-6">
          BRRI Agromet Services Portal
        </h1>

        <p className="text-gray-700 md:text-lg leading-relaxed mb-6 text-justify italic">
          "The BRRI Agromet Services Portal is a comprehensive digital platform
          designed to empower farmers, researchers, and agricultural
          stakeholders with real-time weather data, climate analytics, and
          rice-related statistics. By integrating automated weather stations,
          historical climate records, and secondary data sources, it supports
          informed decision-making for sustainable rice production."
        </p>

        <p className="text-gray-700 md:text-lg leading-relaxed mb-6 text-justify">
          Bangladesh's agriculture is highly dependent on weather and climate
          conditions. Rice, being the staple food and primary crop, requires
          precise management of planting schedules, irrigation, and pest
          control—all of which are significantly influenced by weather patterns.
          The BRRI Agromet Services Portal addresses these challenges by
          providing accessible, accurate, and timely agrometeorological
          information.
        </p>

        <p className="text-gray-700 md:text-lg leading-relaxed mb-6 text-justify">
          Developed by the Agromet Lab at Bangladesh Rice Research Institute
          (BRRI), this portal consolidates data from multiple Automated Weather
          Stations (AWS) deployed across BRRI research stations nationwide. It
          provides real-time monitoring of critical weather parameters including
          temperature, rainfall, humidity, solar radiation, wind speed, and soil
          conditions.
        </p>

        <p className="text-gray-700 md:text-lg leading-relaxed mb-6 text-justify">
          Beyond real-time data, the platform offers access to decades of
          historical climate data, enabling trend analysis and climate change
          research. The secondary data section provides comprehensive
          rice-related statistics including seasonal production data, varietal
          adoption rates, district-wise analytics, and cropping intensity
          information—essential for agricultural planning and policy formulation.
        </p>

        <h2 className="text-xl md:text-2xl font-bold text-primary mb-3">
          Key Features
        </h2>
        <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
          <li>
            <strong>Automated Weather Stations (AWS):</strong> Real-time weather
            monitoring from multiple BRRI research stations across Bangladesh.
          </li>
          <li>
            <strong>Historical Climate Data:</strong> Access to decades of
            temperature, rainfall, humidity, sunshine, and other climate
            parameters for trend analysis.
          </li>
          <li>
            <strong>Secondary Data Sources:</strong> Comprehensive rice
            statistics including seasonal production, varietal data, and
            district-wise analytics.
          </li>
          <li>
            <strong>Data Request System:</strong> Structured process for
            researchers and stakeholders to request customized climate and rice
            data.
          </li>
          <li>
            <strong>Interactive Visualizations:</strong> Dynamic charts and
            graphs for easy interpretation of weather trends and agricultural
            statistics.
          </li>
          <li>
            <strong>Weather Forecasts:</strong> Integration with weather
            forecasting services for agricultural planning.
          </li>
        </ul>

        <h2 className="text-xl md:text-2xl font-bold text-primary mb-3">
          Our Mission
        </h2>
        <p className="text-gray-700 md:text-lg leading-relaxed mb-6 text-justify">
          To bridge the gap between agricultural research and farming
          communities by providing accessible, reliable, and actionable
          agrometeorological information. We aim to support climate-smart rice
          cultivation practices, enhance food security, and contribute to the
          sustainable development of Bangladesh's agricultural sector.
        </p>

        <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-3">
          Contact Information
        </h2>
        <div className="text-gray-700 md:text-lg leading-relaxed mb-6 space-y-2">
          <p>
            <strong>Address:</strong> Agromet Lab, Bangladesh Rice Research
            Institute (BRRI), Gazipur-1701, Bangladesh
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:agromet@brri.gov.bd"
              className="text-primary hover:text-primary-focus underline"
            >
              agromet@brri.gov.bd
            </a>
          </p>
          <p>
            <strong>Call Center Helpline:</strong> 09644300300
          </p>
          <p>
            <strong>Website:</strong>{" "}
            <a
              href="https://brri.gov.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-focus underline"
            >
              https://brri.gov.bd
            </a>
          </p>
        </div>
      </div>

      {/* Patrons Section */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-6 p-6 bg-white shadow-xl rounded-xl w-full max-w-6xl mt-6 hover:shadow-2xl transition-shadow duration-300">
        {patrons.map((patron, index) => (
          <div
            key={index}
            className="text-center group hover:transform hover:scale-105 transition-all duration-300 p-4 rounded-lg hover:bg-gray-50 w-full md:w-auto flex flex-col items-center"
          >
            <h3 className="text-xl font-semibold mb-4 text-primary border-b-2 border-primary/20 pb-2">
              {patron.title}
            </h3>
            <div className="relative overflow-hidden rounded-lg shadow-lg mb-3 group-hover:shadow-xl transition-shadow duration-300">
              <img
                src={patron.image}
                alt={patron.name}
                className="w-60 h-72 object-cover mx-auto border-2 border-gray-200 transition-colors duration-300"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
            <h4 className="mt-3 text-lg font-bold text-gray-800 group-hover:text-primary transition-colors duration-300">
              {patron.name}
            </h4>
            <p className="text-gray-600 mt-1 font-medium">
              {patron.designation}
            </p>
          </div>
        ))}
      </div>

      {/* Reviewed By Section */}
      <div className="px-6 py-6 bg-white shadow-xl rounded-xl w-full max-w-6xl mt-6 hover:shadow-2xl transition-shadow duration-300">
        <h3 className="text-xl font-semibold mb-6 text-primary border-b-2 border-primary/20 pb-3 text-center">
          Reviewed by
        </h3>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          {reviewers.map((reviewer, index) => (
            <div
              key={index}
              className="text-center group hover:transform hover:scale-105 transition-all duration-300 p-4 rounded-lg hover:bg-gray-50 w-full md:w-auto flex flex-col items-center"
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg mb-3 group-hover:shadow-xl transition-shadow duration-300">
                <img
                  src={reviewer.image}
                  alt={reviewer.name}
                  className="w-60 h-72 object-cover mx-auto border-2 border-gray-200 transition-colors duration-300"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </div>
              <h4 className="mt-3 text-lg font-bold text-gray-800 group-hover:text-primary transition-colors duration-300">
                {reviewer.name}
              </h4>
              <p className="text-gray-600 mt-1 font-medium">
                {reviewer.designationLine1}
              </p>
              <p className="text-gray-600 font-medium">
                {reviewer.designationLine2}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan, Database & Execution Section */}
      <div className="px-6 py-6 bg-white shadow-xl rounded-xl w-full max-w-6xl mt-6 hover:shadow-2xl transition-shadow duration-300">
        <h3 className="text-xl font-semibold mb-6 text-primary border-b-2 border-primary/20 pb-3 text-center">
          Plan, Database & Execution By
        </h3>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 group hover:transform hover:scale-[1.02] transition-all duration-300 p-4 rounded-lg hover:bg-gray-50 w-full md:w-auto">
            <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <img
                src="/niaz.jpg"
                alt="Niaz Md. Farhat Rahman"
                className="w-60 h-72 object-cover border-2 border-gray-200 transition-colors duration-300"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
            <div className="space-y-2 mt-3 md:mt-0 text-center md:text-left">
              <h4 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-primary transition-colors duration-300">
                Niaz Md. Farhat Rahman
              </h4>
              <div className="space-y-1 text-gray-600">
                <p className="font-medium">Principal Scientific Officer</p>
                <p className="font-medium">Agricultural Statistics Division</p>
                <p className="font-medium">& Member, Agromet Lab</p>
                <p className="font-medium">
                  Bangladesh Rice Research Institute (BRRI)
                </p>
                <p className="font-medium">Gazipur-1701, Bangladesh.</p>
              </div>
              <div className="pt-2 space-y-1">
                <p className="text-gray-700">
                  <span className="font-semibold">Email:</span>{" "}
                  <a
                    href="mailto:niaz.sust@gmail.com"
                    className="text-primary hover:text-primary-focus underline hover:no-underline transition-all duration-200"
                  >
                    niaz.sust@gmail.com
                  </a>
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Mobile:</span> +8801912700606
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Phone:</span> PABX
                  880-2-49272005-14 Ext. 395
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Development Team Section */}
      <div className="px-6 py-6 bg-white shadow-xl rounded-xl w-full max-w-6xl mt-6 hover:shadow-2xl transition-shadow duration-300">
        <h3 className="text-xl font-semibold mb-6 text-primary border-b-2 border-primary/20 pb-3 text-center">
          Development Team
        </h3>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          {/* Fullstack Developer */}
          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 p-4 rounded-lg hover:bg-gray-50 w-full md:w-auto flex flex-col items-center">
            <div className="relative overflow-hidden rounded-lg shadow-lg mb-3 group-hover:shadow-xl transition-shadow duration-300">
              <img
                src="/riyad.jpg"
                alt="Riyad Ali Mollik"
                className="w-60 h-72 object-cover mx-auto border-2 border-gray-200 transition-colors duration-300"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
            <h4 className="mt-3 text-lg font-bold text-gray-800 group-hover:text-primary transition-colors duration-300">
              Riyad Ali Mollik
            </h4>
            <p className="text-gray-600 mt-1 font-medium">
              Fullstack Developer
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Email:</span>{" "}
              <a
                href="mailto:mollikmdriyadh@gmail.com"
                className="text-primary hover:text-primary-focus underline hover:no-underline transition-all duration-200"
              >
                mollikmdriyadh@gmail.com
              </a>
            </p>
            <p className="text-gray-700 mt-1">
              <span className="font-semibold">Mobile:</span> +8801786563606
            </p>
          </div>

          {/* Frontend Developer */}
          <div className="text-center group hover:transform hover:scale-105 transition-all duration-300 p-4 rounded-lg hover:bg-gray-50 w-full md:w-auto flex flex-col items-center">
            <div className="relative overflow-hidden rounded-lg shadow-lg mb-3 group-hover:shadow-xl transition-shadow duration-300">
              <img
                src="/faysal.JPG"
                alt="Faysal Ahmad Patwary"
                className="w-60 h-72 object-cover mx-auto border-2 border-gray-200 transition-colors duration-300"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </div>
            <h4 className="mt-3 text-lg font-bold text-gray-800 group-hover:text-primary transition-colors duration-300">
              Faysal Ahmad Patwary
            </h4>
            <p className="text-gray-600 mt-1 font-medium">
              Frontend Developer and Designer
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-semibold">Email:</span>{" "}
              <a
                href="mailto:info.faysal.32@gmail.com"
                className="text-primary hover:text-primary-focus underline hover:no-underline transition-all duration-200"
              >
                info.faysal.32@gmail.com
              </a>
            </p>
            <p className="text-gray-700 mt-1">
              <span className="font-semibold">Mobile:</span> +8801615553632
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
