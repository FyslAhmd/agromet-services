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

  // Metric button config for DRY rendering
  const metricButtons = [
    { key: 'rf', label: 'Rainfall', shortLabel: 'RF', icon: Droplets, color: 'teal' },
    { key: 'temp', label: 'Temperature', shortLabel: 'Temp', icon: Thermometer, color: 'orange' },
    { key: 'rh', label: 'Humidity', shortLabel: 'RH', icon: CloudDrizzle, color: 'cyan' },
    { key: 'windspd', label: 'Wind Speed', shortLabel: 'Speed', icon: Wind, color: 'emerald' },
    { key: 'winddir', label: 'Direction', shortLabel: 'Dir', icon: Navigation, color: 'sky' },
    { key: 'cldcvr', label: 'Cloud Cover', shortLabel: 'Cloud', icon: Cloud, color: 'violet' },
    { key: 'windgust', label: 'Wind Gust', shortLabel: 'Gust', icon: CloudRain, color: 'rose' },
  ];

  return (
    <div className="w-full min-h-full">
      {/* Page Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Weather Forecast
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time weather data &amp; 5-day forecast across Bangladesh
          </p>
        </div>

        {/* Location selector — inline on desktop */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="locationType" className="text-sm font-medium text-gray-600 whitespace-nowrap">
            View by
          </label>
          <select
            id="locationType"
            value={locationType}
            onChange={handleLocationTypeChange}
            className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all cursor-pointer font-medium text-gray-700 shadow-sm"
          >
            <option value="division">Division</option>
            <option value="district">District</option>
            <option value="upazila">Upazila</option>
          </select>
        </div>
      </div>

      {/* Main Grid — maps + forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:items-stretch">

        {/* ── Left: Primary Map ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Bangladesh Map
              </h2>
              {selectedFeature && (
                <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-100">
                  {selectedFeature.properties.NAME_3 || selectedFeature.properties.NAME_2 || selectedFeature.properties.NAME_1}
                </span>
              )}
            </div>
            <div className="relative" style={{ height: '680px' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="absolute inset-0"
                style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
                zoomControl={true}
                attributionControl={false}
              >
                <MapController center={mapCenter} zoom={mapZoom} />
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

        {/* ── Right: Secondary map + Forecast ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Secondary / zoomed map */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">
                {selectedFeature
                  ? (selectedFeature.properties.NAME_3 || selectedFeature.properties.NAME_2 || selectedFeature.properties.NAME_1)
                  : 'Selected Area'}
              </h2>
            </div>
            <div className="relative flex-1" style={{ minHeight: '260px' }}>
              <MapContainer
                center={secondaryMapCenter}
                zoom={secondaryMapZoom}
                className="absolute inset-0"
                style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
                zoomControl={false}
                scrollWheelZoom={false}
                attributionControl={false}
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

          {/* Forecast Card */}
          {(forecastData.length > 0 || isLoadingForecast) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              {/* Card header */}
              <div className="px-4 py-3 bg-linear-to-r from-[#0a3d3d] to-[#0d5555] flex items-center gap-2">
                <CloudRain className="w-4.5 h-4.5 text-teal-300" />
                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight">
                    5-Day Forecast
                  </h3>
                  <p className="text-[11px] text-teal-300/70">
                    {locationType.charAt(0).toUpperCase() + locationType.slice(1)} level
                  </p>
                </div>
              </div>

              {/* Metric tabs */}
              <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50/60">
                <div className="flex flex-wrap gap-1.5">
                  {metricButtons.map(({ key, shortLabel, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveMetric(key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        activeMetric === key
                          ? 'bg-[#0d4a4a] text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Forecast table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Date
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Avg ({getMetricInfo(activeMetric).unit})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoadingForecast ? (
                      <tr>
                        <td colSpan="2" className="px-4 py-8 text-center">
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium">Loading…</span>
                          </div>
                        </td>
                      </tr>
                    ) : forecastData.length > 0 ? (
                      forecastData.slice(0, 5).map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-teal-50/40 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-sm text-gray-700 font-medium whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="text-base font-bold text-teal-700">
                              {item[activeMetric]?.val_avg != null
                                ? parseFloat(item[activeMetric].val_avg).toFixed(2)
                                : '—'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-4 py-6 text-center text-sm text-gray-400">
                          No forecast data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
