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
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload sunshine data from CSV/XLSX
router.post("/upload", authMiddleware, adminMiddleware, uploadSunshineData);

// Get all sunshine data with pagination
router.get("/", authMiddleware, registeredUserMiddleware, getAllSunshineData);

// Get unique stations
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);

// Get unique years
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);

// Get sunshine data by ID
router.get("/:id", authMiddleware, registeredUserMiddleware, getSunshineDataById);

// Create a single sunshine record
router.post("/", authMiddleware, adminMiddleware, createSunshineData);

// Update sunshine data
router.put("/:id", authMiddleware, adminMiddleware, updateSunshineData);

// Delete sunshine data
router.delete("/:id", authMiddleware, adminMiddleware, deleteSunshineData);

export default router;
