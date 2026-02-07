// API Configuration for Agromet Services
// Switch between development and production environments

const isDevelopment = false;

// API Base URLs
const API_URLS = {
  development: "http://localhost:5000/api",
  production: "https://agromet.brri.gov.bd/api", // Update with actual production URL
};

// External API URLs (SAADS for weather data, CCMS for historical climate data, DCRS for rice data)
const EXTERNAL_API_URLS = {
  saads: "https://saads.brri.gov.bd/api",
  ccms: "https://ccms.brri.gov.bd",
  dcrs: "https://dcrs.brri.gov.bd",
};

// Get the appropriate API URL
export const API_BASE_URL = isDevelopment ? API_URLS.development : API_URLS.production;

// Base URL for uploaded files (strip /api from API_BASE_URL)
export const UPLOADS_BASE_URL = API_BASE_URL.replace('/api', '');

// External APIs
export const SAADS_API_URL = EXTERNAL_API_URLS.saads;
export const CCMS_API_URL = EXTERNAL_API_URLS.ccms;
export const DCRS_API_URL = EXTERNAL_API_URLS.dcrs;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/users/login`,
  register: `${API_BASE_URL}/users/register`,
  currentUser: `${API_BASE_URL}/users/current`,
  
  // Users
  users: `${API_BASE_URL}/users`,
  userById: (id) => `${API_BASE_URL}/users/${id}`,
  changePassword: (id) => `${API_BASE_URL}/users/${id}/password`,
  uploadProfilePicture: (id) => `${API_BASE_URL}/users/${id}/profile-picture`,
  removeProfilePicture: (id) => `${API_BASE_URL}/users/${id}/profile-picture`,
  approveUser: (id) => `${API_BASE_URL}/users/${id}/approve`,
  rejectUser: (id) => `${API_BASE_URL}/users/${id}/reject`,
  
  // Weather Data (from SAADS)
  weatherStations: `${SAADS_API_URL}/research-measures/stations`,
  weatherData: (stationId, parameter) => 
    `${SAADS_API_URL}/research-measures/time-series?station_id=${stationId}&parameter=${parameter}`,
  cisRequest: `${SAADS_API_URL}/cis`,
};

// Helper function for authenticated requests
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// API fetch wrapper with error handling
export const apiFetch = async (url, options = {}) => {
  const defaultOptions = {
    headers: getAuthHeaders(),
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  
  return response.json();
};

export default {
  API_BASE_URL,
  SAADS_API_URL,
  CCMS_API_URL,
  DCRS_API_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  apiFetch,
  isDevelopment,
};
