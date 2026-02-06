import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  CloudRain, 
  Wind, 
  Droplets,
  CloudDrizzle,
  Thermometer,
  Navigation,
  Cloud
} from 'lucide-react';

const IRAS_API_URL = 'https://iras.brri.gov.bd';

// Component to handle map zoom and center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const WeatherForecast = () => {
  const [locationType, setLocationType] = useState('division'); // 'division', 'district', or 'upazila'
  const [activeLayer, setActiveLayer] = useState('rainfall');
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]); // Bangladesh center
  const [mapZoom, setMapZoom] = useState(7);
  const [geoJSONData, setGeoJSONData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [secondaryMapCenter, setSecondaryMapCenter] = useState([23.8103, 90.4125]);
  const [secondaryMapZoom, setSecondaryMapZoom] = useState(7);
  const [forecastData, setForecastData] = useState([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [locationsData, setLocationsData] = useState([]);
  const [activeMetric, setActiveMetric] = useState('rf'); // 'rf', 'temp', 'rh', 'windspd', 'winddir', 'cldcvr', 'windgust'
  
  // Load GeoJSON data
  useEffect(() => {
    fetch('/bangladesh.geojson')
      .then(response => response.json())
      .then(data => {
        setGeoJSONData(data);
      })
      .catch(error => console.error('Error loading GeoJSON:', error));
  }, []);

  // Auto-select on initial load
  useEffect(() => {
    console.log('Auto-select effect running. Location type:', locationType, 'GeoJSON loaded:', !!geoJSONData);
    if (!geoJSONData) return;

    // Helper function to get center
    const getCenterPoint = (feature) => {
      if (!feature.geometry) return null;
      
      let allCoords = [];
      
      if (feature.geometry.type === 'Polygon') {
        allCoords = feature.geometry.coordinates[0];
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          allCoords.push(...polygon[0]);
        });
      }
      
      if (allCoords.length === 0) return null;
      
      let sumLat = 0, sumLng = 0;
      allCoords.forEach(coord => {
        sumLng += coord[0];
        sumLat += coord[1];
      });
      
      return [sumLat / allCoords.length, sumLng / allCoords.length];
    };

    // Find feature based on location type
    let selectedFeatureToSet = null;
    
    if (locationType === 'division') {
      // Find Dhaka division
      const dhakaDivisionFeatures = geoJSONData.features.filter(
        f => f.properties.NAME_1 === 'Dhaka'
      );
      if (dhakaDivisionFeatures.length > 0) {
        selectedFeatureToSet = {
          type: 'Feature',
          properties: {
            NAME_1: 'Dhaka',
            NAME_2: null,
            NAME_3: null
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: []
          }
        };
        dhakaDivisionFeatures.forEach(f => {
          if (f.geometry.type === 'Polygon') {
            selectedFeatureToSet.geometry.coordinates.push(f.geometry.coordinates);
          } else if (f.geometry.type === 'MultiPolygon') {
            selectedFeatureToSet.geometry.coordinates.push(...f.geometry.coordinates);
          }
        });
      }
    } else if (locationType === 'district') {
      // Select a random district - get unique districts and pick one
      const districtMap = new Map();
      geoJSONData.features.forEach(feature => {
        const districtName = feature.properties.NAME_2;
        if (!districtMap.has(districtName)) {
          districtMap.set(districtName, []);
        }
        districtMap.get(districtName).push(feature);
      });
      
      // Get first district
      const firstDistrictName = districtMap.keys().next().value;
      const districtFeatures = districtMap.get(firstDistrictName);
      
      if (districtFeatures && districtFeatures.length > 0) {
        selectedFeatureToSet = {
          type: 'Feature',
          properties: {
            NAME_1: districtFeatures[0].properties.NAME_1,
            NAME_2: firstDistrictName,
            NAME_3: null
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: []
          }
        };
        districtFeatures.forEach(f => {
          if (f.geometry.type === 'Polygon') {
            selectedFeatureToSet.geometry.coordinates.push(f.geometry.coordinates);
          } else if (f.geometry.type === 'MultiPolygon') {
            selectedFeatureToSet.geometry.coordinates.push(...f.geometry.coordinates);
          }
        });
      }
    } else {
      // Select first upazila with NAME_3
      selectedFeatureToSet = geoJSONData.features.find(
        f => f.properties.NAME_3
      );
    }

    if (selectedFeatureToSet) {
      console.log('Auto-selecting feature:', selectedFeatureToSet.properties);
      setSelectedFeature(selectedFeatureToSet);
      const center = getCenterPoint(selectedFeatureToSet);
      if (center) {
        setSecondaryMapCenter(center);
        if (locationType === 'division') {
          setSecondaryMapZoom(7);
        } else if (locationType === 'district') {
          setSecondaryMapZoom(8);
        } else {
          setSecondaryMapZoom(9);
        }
      }
    } else {
      console.log('No feature found for auto-select');
    }
  }, [geoJSONData, locationType]);
  
  // Load locations data from API
  useEffect(() => {
    fetch(`${IRAS_API_URL}/api/weather/locations`)
      .then(response => response.json())
      .then(data => {
        // Backend returns: { success, data: { status, result } }
        if (data && data.success && data.data && data.data.result) {
          setLocationsData(data.data.result);
        }
      })
      .catch(error => console.error('Error loading locations:', error));
  }, []);
  
  // Fetch forecast data when a feature is selected
  useEffect(() => {
    if (!selectedFeature) {
      setForecastData([]);
      return;
    }

    // Wait for locations data to be loaded
    if (locationsData.length === 0) {
      return;
    }
    
    const fetchForecast = async () => {
      setIsLoadingForecast(true);
      try {
        let url = '';
        
        console.log('Selected feature properties:', selectedFeature.properties);
        
        if (locationType === 'division') {
          // Get division ID from NAME_1
          const divisionId = getDivisionId(selectedFeature.properties.NAME_1);
          url = `${IRAS_API_URL}/api/weather/forecast?type=division&id=${divisionId}`;
        } else if (locationType === 'district') {
          // Get district ID from NAME_2
          const districtId = getDistrictId(selectedFeature.properties.NAME_2);
          url = `${IRAS_API_URL}/api/weather/forecast?type=district&id=${districtId}`;
        } else {
          // For upazila, use the ID from properties or lat/lon
          const upazilaId = getUpazilaId(selectedFeature.properties.NAME_3);
          url = `${IRAS_API_URL}/api/weather/forecast?type=upazila&id=${upazilaId}`;
        }
        
        console.log('Fetching forecast:', url);
        const response = await fetch(url);
        const data = await response.json();
        
        // Store the complete daily forecast data
        // Backend returns: { success, data: { status, result: { daily } } }
        if (data && data.success && data.data && data.data.result && data.data.result.daily) {
          setForecastData(data.data.result.daily.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching forecast:', error);
        setForecastData([]);
      } finally {
        setIsLoadingForecast(false);
      }
    };
    
    fetchForecast();
  }, [selectedFeature, locationType, locationsData]);
  
  // Helper functions to map location names to IDs using API data
  const getDivisionId = (divisionName) => {
    // Find a location entry that matches the division name and get its adm1_pcode
    const location = locationsData.find(loc => loc.division === divisionName);
    console.log('Division lookup:', divisionName, 'Found:', location);
    return location ? location.adm1_pcode : '30';
  };
  
  const getDistrictId = (districtName) => {
    // Find a location entry that matches the district name and get its adm2_pcode
    const location = locationsData.find(loc => loc.district === districtName);
    console.log('District lookup:', districtName, 'Found:', location);
    // Return the first match's adm2_pcode, or default
    return location ? location.adm2_pcode : (locationsData.length > 0 ? locationsData[0].adm2_pcode : '3026');
  };
  
  const getUpazilaId = (upazilaName) => {
    // Find a location entry that matches the upazila name and get its adm3_pcode
    const location = locationsData.find(loc => loc.upazila === upazilaName);
    console.log('Upazila lookup:', upazilaName, 'Found:', location);
    // Return the first match's adm3_pcode, or default
    return location ? location.adm3_pcode : (locationsData.length > 0 ? locationsData[0].adm3_pcode : '302602');
  };

  const handleLocationTypeChange = (e) => {
    const type = e.target.value;
    setLocationType(type);
    
    // Reset map to Bangladesh center
    setMapCenter([23.8103, 90.4125]);
    setSelectedFeature(null);
    setSecondaryMapCenter([23.8103, 90.4125]);
    setSecondaryMapZoom(7);
    
    if (type === 'division') {
      setMapZoom(7);
    } else if (type === 'district') {
      setMapZoom(7);
    } else if (type === 'upazila') {
      setMapZoom(8);
    }
  };

  // Filter GeoJSON data based on location type
  const getFilteredGeoJSON = () => {
    if (!geoJSONData) return null;
    
    if (locationType === 'upazila') {
      // Show all upazilas (original data)
      return geoJSONData;
    }
    
    if (locationType === 'district') {
      // Show district-level boundaries (group by district)
      const districtMap = new Map();
      geoJSONData.features.forEach(feature => {
        const districtName = feature.properties.NAME_2;
        if (!districtMap.has(districtName)) {
          districtMap.set(districtName, []);
        }
        districtMap.get(districtName).push(feature);
      });
      
      // Create merged features for each district
      const districtFeatures = [];
      districtMap.forEach((features, districtName) => {
        if (features.length > 0) {
          const mergedFeature = {
            type: 'Feature',
            properties: {
              NAME_1: features[0].properties.NAME_1,
              NAME_2: districtName,
              NAME_3: null
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: []
            }
          };
          
          features.forEach(f => {
            if (f.geometry.type === 'Polygon') {
              mergedFeature.geometry.coordinates.push(f.geometry.coordinates);
            } else if (f.geometry.type === 'MultiPolygon') {
              mergedFeature.geometry.coordinates.push(...f.geometry.coordinates);
            }
          });
          
          districtFeatures.push(mergedFeature);
        }
      });
      
      return {
        type: 'FeatureCollection',
        features: districtFeatures
      };
    }
    
    // Show division-level boundaries (group by division)
    const divisionMap = new Map();
    geoJSONData.features.forEach(feature => {
      const divisionName = feature.properties.NAME_1;
      if (!divisionMap.has(divisionName)) {
        divisionMap.set(divisionName, []);
      }
      divisionMap.get(divisionName).push(feature);
    });
    
    const divisionFeatures = [];
    divisionMap.forEach((features, divisionName) => {
      if (features.length > 0) {
        const mergedFeature = {
          type: 'Feature',
          properties: {
            NAME_1: divisionName,
            NAME_2: null,
            NAME_3: null
          },
          geometry: {
            type: 'MultiPolygon',
            coordinates: []
          }
        };
        
        features.forEach(f => {
          if (f.geometry.type === 'Polygon') {
            mergedFeature.geometry.coordinates.push(f.geometry.coordinates);
          } else if (f.geometry.type === 'MultiPolygon') {
            mergedFeature.geometry.coordinates.push(...f.geometry.coordinates);
          }
        });
        
        divisionFeatures.push(mergedFeature);
      }
    });
    
    return {
      type: 'FeatureCollection',
      features: divisionFeatures
    };
  };

  // Color palette for different locations
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#ABEBC6',
    '#F1948A', '#73C6B6', '#FAD7A0', '#D7BDE2', '#A9CCE3',
    '#F9E79F', '#A3E4D7', '#FADBD8', '#D5F4E6', '#EBDEF0'
  ];

  // Generate color based on location name (consistent colors for same locations)
  const getColorForLocation = (feature) => {
    let locationName = '';
    if (locationType === 'division') {
      locationName = feature.properties.NAME_1 || '';
    } else if (locationType === 'district') {
      locationName = feature.properties.NAME_2 || '';
    } else {
      locationName = feature.properties.NAME_3 || '';
    }
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < locationName.length; i++) {
      hash = locationName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Style function for GeoJSON layers
  const geoJSONStyle = (feature) => {
    // For divisions and districts, use thinner borders since we're showing merged boundaries
    const borderWeight = locationType === 'upazila' ? 1 : 2;
    
    return {
      fillColor: getColorForLocation(feature),
      weight: borderWeight,
      opacity: 0,
      color: '#000000', // Black border
      fillOpacity: 0.6
    };
  };

  // Get the center point of a feature's geometry
  const getFeatureCenter = (feature) => {
    if (!feature.geometry) return null;
    
    let allCoords = [];
    
    if (feature.geometry.type === 'Polygon') {
      allCoords = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        allCoords.push(...polygon[0]);
      });
    }
    
    if (allCoords.length === 0) return null;
    
    // Calculate centroid
    let sumLat = 0, sumLng = 0;
    allCoords.forEach(coord => {
      sumLng += coord[0];
      sumLat += coord[1];
    });
    
    return [sumLat / allCoords.length, sumLng / allCoords.length];
  };

  const onEachFeature = (feature, layer) => {
    const div = feature.properties.NAME_1;
    const dist = feature.properties.NAME_2;
    const upazila = feature.properties.NAME_4;
    
    if (div || dist || upazila) {
      layer.bindPopup(`
        <div class="p-2">
          ${div ? `<p class="text-xs text-gray-500">Division: ${div}</p>` : ''}
          ${dist ? `<p class="font-semibold">${dist}</p>` : ''}
          ${upazila ? `<p class="text-sm text-gray-600">Upazila: ${upazila}</p>` : ''}
        </div>
      `);
      
      layer.on({
        click: (e) => {
          setSelectedFeature(feature);
          const center = getFeatureCenter(feature);
          if (center) {
            setSecondaryMapCenter(center);
            // Set zoom based on location type
            if (locationType === 'division') {
              setSecondaryMapZoom(7);
            } else if (locationType === 'district') {
              setSecondaryMapZoom(8);
            } else {
              setSecondaryMapZoom(9);
            }
          }
        },
        mouseover: (e) => {
          e.target.setStyle({
            fillOpacity: 0.9,
            weight: 0,
            color: '#000000'
          });
        },
        mouseout: (e) => {
          e.target.setStyle({
            fillOpacity: 0.6,
            weight: 0,
            color: '#000000'
          });
        }
      });
    }
  };

  // Get filtered data for secondary map (show only selected feature if any)
  const getSecondaryMapData = () => {
    if (!selectedFeature) {
      return getFilteredGeoJSON(); // Show all Bangladesh
    }
    
    // Show only the selected feature
    return {
      type: 'FeatureCollection',
      features: [selectedFeature]
    };
  };

  // Get metric display info
  const getMetricInfo = (metric) => {
    const metricMap = {
      rf: { label: 'Rainfall', unit: 'mm' },
      temp: { label: 'Temperature', unit: '°C' },
      rh: { label: 'Relative Humidity', unit: '%' },
      windspd: { label: 'Wind Speed', unit: 'km/h' },
      winddir: { label: 'Wind Direction', unit: 'deg' },
      cldcvr: { label: 'Cloud Cover', unit: 'oktas' },
      windgust: { label: 'Wind Gust', unit: 'km/h' }
    };
    return metricMap[metric] || { label: 'Unknown', unit: '' };
  };

  return (
    <div className="w-full px-4 py-6 min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Bangladesh Weather Forecast
        </h1>
        <p className="text-gray-600">Real-time weather data and 5-day forecast</p>
      </div>

      {/* Filters Section */}
      <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/20">
        <h5 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-linear-to-b from-blue-500 to-purple-500 rounded-full"></span>
          Select Location Type
        </h5>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="locationType" className="block text-sm font-semibold text-gray-700 mb-3">
              View Map By
            </label>
            <select
              id="locationType"
              value={locationType}
              onChange={handleLocationTypeChange}
              className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-blue-300 cursor-pointer text-gray-700 font-medium shadow-sm"
            >
              <option value="division">🏙️ Division</option>
              <option value="district">🏘️ District</option>
              <option value="upazila">🏡 Upazila</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side - Map View */}
        <div className="mb-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl h-full flex flex-col border border-white/20 overflow-hidden">
            <div className="p-0 relative flex-1 bg-linear-to-br from-blue-50 to-indigo-50" style={{ minHeight: '600px' }}>
             

              {/* Leaflet Map */}
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="w-full h-full"
                style={{ minHeight: '600px', backgroundColor: '#ffffff' }}
                zoomControl={true}
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                
                {/* Render GeoJSON data */}
                {geoJSONData && (
                  <GeoJSON
                    key={`geojson-${locationType}`}
                    data={getFilteredGeoJSON()}
                    style={geoJSONStyle}
                    onEachFeature={onEachFeature}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Right Side - District Alert & Forecast */}
        <div className="mb-4">
          <div className="flex flex-col h-full gap-4">
            {/* District Rainfall Alert */}
            <div>
              <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="p-6">
                  {/* Secondary Map for specific area */}
                  <div className="relative bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl h-75 overflow-hidden border-2 border-gray-200 shadow-inner">
                    <MapContainer
                      center={secondaryMapCenter}
                      zoom={secondaryMapZoom}
                      className="w-full h-full rounded-2xl"
                      style={{ height: '300px', backgroundColor: '#ffffff' }}
                      zoomControl={false}
                      scrollWheelZoom={false}
                    >
                      <MapController center={secondaryMapCenter} zoom={secondaryMapZoom} />
                      {geoJSONData && (
                        <GeoJSON
                          key={`secondary-${locationType}-${selectedFeature ? selectedFeature.properties.NAME_1 + selectedFeature.properties.NAME_2 + selectedFeature.properties.NAME_3 : 'all'}`}
                          data={getSecondaryMapData()}
                          style={geoJSONStyle}
                        />
                      )}
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Table */}
            {(forecastData.length > 0 || isLoadingForecast) && (
              <div>
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="bg-[#2d3748] px-6 py-5">
                    <h5 className="text-lg font-bold text-white m-0 flex items-center gap-2">
                      <CloudRain className="w-5 h-5" />
                      5-Day Weather Forecast
                    </h5>
                    <p className="text-purple-100 text-sm mt-1">{locationType.charAt(0).toUpperCase() + locationType.slice(1)} Level Data</p>
                  </div>
                
                {/* Metric Tabs */}
                <div className="bg-linear-to-r from-gray-50 to-gray-100 px-6 border-b border-gray-200">
                  <div className="flex flex-wrap gap-2 py-4">
                    <button
                      onClick={() => setActiveMetric('rf')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                        activeMetric === 'rf'
                          ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <Droplets className="w-4 h-4" />
                      RF
                    </button>
                    <button
                      onClick={() => setActiveMetric('temp')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                        activeMetric === 'temp'
                          ? 'bg-linear-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/50'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <Thermometer className="w-4 h-4" />
                      Temp
                    </button>
                    <button
                      onClick={() => setActiveMetric('rh')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                        activeMetric === 'rh'
                          ? 'bg-linear-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <CloudDrizzle className="w-4 h-4" />
                      RH
                    </button>
                    <button
                      onClick={() => setActiveMetric('windspd')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                        activeMetric === 'windspd'
                          ? 'bg-linear-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <Wind className="w-4 h-4" />
                      Speed
                    </button>
                    <button
                      onClick={() => setActiveMetric('winddir')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                        activeMetric === 'winddir'
                          ? 'bg-linear-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/50'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <Navigation className="w-4 h-4" />
                      Dir
                    </button>
                    <button
                      onClick={() => setActiveMetric('cldcvr')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                        activeMetric === 'cldcvr'
                          ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/50'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <Cloud className="w-4 h-4" />
                      Cloud
                    </button>
                    <button
                      onClick={() => setActiveMetric('windgust')}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                        activeMetric === 'windgust'
                          ? 'bg-linear-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/50'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <CloudRain className="w-4 h-4" />
                      Gust
                    </button>
                  </div>
                </div>

                <div className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-linear-to-r from-gray-100 to-gray-50">
                        <tr>
                          <th className="border border-gray-200 px-4 py-4 text-center font-bold text-gray-800 bg-linear-to-br from-blue-50 to-purple-50">DATE</th>
                          {forecastData.length > 0 ? (
                            forecastData.slice(0, 5).map((item, index) => (
                              <th key={index} className="border border-gray-200 px-4 py-4 text-center font-semibold text-gray-700 bg-white">{item.date}</th>
                            ))
                          ) : (
                            <>
                              <th className="border border-gray-200 px-4 py-4 text-center text-gray-500 bg-white">-</th>
                              <th className="border border-gray-200 px-4 py-4 text-center text-gray-500 bg-white">-</th>
                              <th className="border border-gray-200 px-4 py-4 text-center text-gray-500 bg-white">-</th>
                              <th className="border border-gray-200 px-4 py-4 text-center text-gray-500 bg-white">-</th>
                              <th className="border border-gray-200 px-4 py-4 text-center text-gray-500 bg-white">-</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-blue-50/50 transition-colors">
                          <td className="border border-gray-200 px-4 py-4 text-center font-bold text-gray-800 bg-linear-to-br from-blue-50 to-purple-50">
                            AVG ({getMetricInfo(activeMetric).unit})
                          </td>
                          {isLoadingForecast ? (
                            <td colSpan="5" className="border border-gray-200 px-4 py-4 text-center text-gray-500 bg-white">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-medium">Loading forecast data...</span>
                              </div>
                            </td>
                          ) : (
                            forecastData.map((item, index) => (
                              <td key={index} className="border border-gray-200 px-4 py-4 text-center bg-white">
                                <span className="font-bold text-lg bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  {item[activeMetric]?.val_avg != null ? parseFloat(item[activeMetric].val_avg).toFixed(2) : '-'}
                                </span>
                              </td>
                            ))
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
