import express from "express";
import {
  uploadRainfallData,
  getAllRainfallData,
  getStations,
  getYears,
  getRainfallDataById,
  createRainfallData,
  updateRainfallData,
  deleteRainfallData,
} from "../controllers/rainfallController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload rainfall data from CSV/XLSX
router.post("/upload", authMiddleware, adminMiddleware, uploadRainfallData);

// Get all rainfall data with pagination
router.get("/", authMiddleware, registeredUserMiddleware, getAllRainfallData);

// Get unique stations
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);

// Get unique years
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);

// Get rainfall data by ID
router.get("/:id", authMiddleware, registeredUserMiddleware, getRainfallDataById);

// Create a single rainfall record
router.post("/", authMiddleware, adminMiddleware, createRainfallData);

// Update rainfall data
router.put("/:id", authMiddleware, adminMiddleware, updateRainfallData);

// Delete rainfall data
router.delete("/:id", authMiddleware, adminMiddleware, deleteRainfallData);

export default router;
