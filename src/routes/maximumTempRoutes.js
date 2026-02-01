import express from "express";
import {
  uploadMaximumTempData,
  getAllMaximumTempData,
  getStations,
  getYears,
  getMaximumTempDataById,
  createMaximumTempData,
  updateMaximumTempData,
  deleteMaximumTempData,
} from "../controllers/maximumTempController.js";

const router = express.Router();

// Upload maximum temperature data from CSV/XLSX
router.post("/upload", uploadMaximumTempData);

// Get all maximum temperature data with pagination
router.get("/", getAllMaximumTempData);

// Get unique stations
router.get("/stations", getStations);

// Get unique years
router.get("/years", getYears);

// Get maximum temperature data by ID
router.get("/:id", getMaximumTempDataById);

// Create a single maximum temperature record
router.post("/", createMaximumTempData);

// Update maximum temperature data
router.put("/:id", updateMaximumTempData);

// Delete maximum temperature data
router.delete("/:id", deleteMaximumTempData);

export default router;
