import express from "express";
import {
  uploadSunshineData,
  getAllSunshineData,
  getStations,
  getYears,
  getSunshineDataById,
  createSunshineData,
  updateSunshineData,
  deleteSunshineData,
} from "../controllers/sunshineController.js";

const router = express.Router();

// Upload sunshine data from CSV/XLSX
router.post("/upload", uploadSunshineData);

// Get all sunshine data with pagination
router.get("/", getAllSunshineData);

// Get unique stations
router.get("/stations", getStations);

// Get unique years
router.get("/years", getYears);

// Get sunshine data by ID
router.get("/:id", getSunshineDataById);

// Create a single sunshine record
router.post("/", createSunshineData);

// Update sunshine data
router.put("/:id", updateSunshineData);

// Delete sunshine data
router.delete("/:id", deleteSunshineData);

export default router;
