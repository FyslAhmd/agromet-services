import express from "express";
import {
  uploadMinimumTempData,
  getAllMinimumTempData,
  getStations,
  getYears,
  getMinimumTempDataById,
  createMinimumTempData,
  updateMinimumTempData,
  deleteMinimumTempData,
} from "../controllers/minimumTempController.js";

const router = express.Router();

// Upload minimum temperature data from CSV/XLSX
router.post("/upload", uploadMinimumTempData);

// Get all minimum temperature data with pagination
router.get("/", getAllMinimumTempData);

// Get unique stations
router.get("/stations", getStations);

// Get unique years
router.get("/years", getYears);

// Get minimum temperature data by ID
router.get("/:id", getMinimumTempDataById);

// Create a single minimum temperature record
router.post("/", createMinimumTempData);

// Update minimum temperature data
router.put("/:id", updateMinimumTempData);

// Delete minimum temperature data
router.delete("/:id", deleteMinimumTempData);

export default router;