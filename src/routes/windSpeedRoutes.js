import express from "express";
import {
  uploadWindSpeedData,
  getAllWindSpeedData,
  getStations,
  getYears,
  getWindSpeedDataById,
  createWindSpeedData,
  updateWindSpeedData,
  deleteWindSpeedData,
} from "../controllers/windSpeedController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload wind speed data from CSV/XLSX
router.post("/upload", authMiddleware, adminMiddleware, uploadWindSpeedData);

// Get all wind speed data with pagination
router.get("/", authMiddleware, registeredUserMiddleware, getAllWindSpeedData);

// Get unique stations
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);

// Get unique years
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);

// Get wind speed data by ID
router.get("/:id", authMiddleware, registeredUserMiddleware, getWindSpeedDataById);

// Create a single wind speed record
router.post("/", authMiddleware, adminMiddleware, createWindSpeedData);

// Update wind speed data
router.put("/:id", authMiddleware, adminMiddleware, updateWindSpeedData);

// Delete wind speed data
router.delete("/:id", authMiddleware, adminMiddleware, deleteWindSpeedData);

export default router;
