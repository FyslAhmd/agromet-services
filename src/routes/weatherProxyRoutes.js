import express from "express";
import axios from "axios";

const router = express.Router();

const IRAS_API_URL = process.env.IRAS_API_URL || "https://iras.brri.gov.bd";

// Proxy: GET /api/weather/locations
router.get("/locations", async (req, res) => {
  try {
    const response = await axios.get(`${IRAS_API_URL}/api/weather/locations`);
    res.json(response.data);
  } catch (error) {
    console.error("Weather Proxy Error (locations):", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to fetch weather locations",
    });
  }
});

// Proxy: GET /api/weather/forecast?type=...&id=...
router.get("/forecast", async (req, res) => {
  try {
    const response = await axios.get(`${IRAS_API_URL}/api/weather/forecast`, {
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Weather Proxy Error (forecast):", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to fetch weather forecast",
    });
  }
});

// Proxy: GET /api/weather/location?lat=...&lon=...
router.get("/location", async (req, res) => {
  try {
    const response = await axios.get(`${IRAS_API_URL}/api/weather/location`, {
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Weather Proxy Error (location):", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to fetch weather location",
    });
  }
});

// Proxy: GET /api/weather/alert-district?parameter=...&fdate=...
router.get("/alert-district", async (req, res) => {
  try {
    const response = await axios.get(`${IRAS_API_URL}/api/weather/alert-district`, {
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Weather Proxy Error (alert-district):", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to fetch alert district data",
    });
  }
});

// Proxy: GET /api/weather/alert-upazila?district_id=...&parameter=...&fdate=...
router.get("/alert-upazila", async (req, res) => {
  try {
    const response = await axios.get(`${IRAS_API_URL}/api/weather/alert-upazila`, {
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    console.error("Weather Proxy Error (alert-upazila):", error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: "Failed to fetch alert upazila data",
    });
  }
});

export default router;
