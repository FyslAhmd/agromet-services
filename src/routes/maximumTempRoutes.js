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
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload maximum temperature data from CSV/XLSX
router.post("/upload", authMiddleware, adminMiddleware, uploadMaximumTempData);

// Get all maximum temperature data with pagination
router.get("/", authMiddleware, registeredUserMiddleware, getAllMaximumTempData);

// Get unique stations
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);

// Get unique years
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);

// Get maximum temperature data by ID
router.get("/:id", authMiddleware, registeredUserMiddleware, getMaximumTempDataById);

// Create a single maximum temperature record
router.post("/", authMiddleware, adminMiddleware, createMaximumTempData);

// Update maximum temperature data
router.put("/:id", authMiddleware, adminMiddleware, updateMaximumTempData);

// Delete maximum temperature data
router.delete("/:id", authMiddleware, adminMiddleware, deleteMaximumTempData);

export default router;
