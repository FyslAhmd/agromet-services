import express from "express";
import {
  uploadRelativeHumidityData,
  getAllRelativeHumidityData,
  getStations,
  getYears,
  getRelativeHumidityDataById,
  createRelativeHumidityData,
  updateRelativeHumidityData,
  deleteRelativeHumidityData,
} from "../controllers/relativeHumidityController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload relative humidity data from CSV/XLSX
router.post("/upload", authMiddleware, adminMiddleware, uploadRelativeHumidityData);

// Get all relative humidity data with pagination
router.get("/", authMiddleware, registeredUserMiddleware, getAllRelativeHumidityData);

// Get unique stations
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);

// Get unique years
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);

// Get relative humidity data by ID
router.get("/:id", authMiddleware, registeredUserMiddleware, getRelativeHumidityDataById);

// Create a single relative humidity record
router.post("/", authMiddleware, adminMiddleware, createRelativeHumidityData);

// Update relative humidity data
router.put("/:id", authMiddleware, adminMiddleware, updateRelativeHumidityData);

// Delete relative humidity data
router.delete("/:id", authMiddleware, adminMiddleware, deleteRelativeHumidityData);

export default router;
