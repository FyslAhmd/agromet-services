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
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload minimum temperature data from CSV/XLSX
router.post("/upload", authMiddleware, adminMiddleware, uploadMinimumTempData);

// Get all minimum temperature data with pagination
router.get("/", authMiddleware, registeredUserMiddleware, getAllMinimumTempData);

// Get unique stations
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);

// Get unique years
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);

// Get minimum temperature data by ID
router.get("/:id", authMiddleware, registeredUserMiddleware, getMinimumTempDataById);

// Create a single minimum temperature record
router.post("/", authMiddleware, adminMiddleware, createMinimumTempData);

// Update minimum temperature data
router.put("/:id", authMiddleware, adminMiddleware, updateMinimumTempData);

// Delete minimum temperature data
router.delete("/:id", authMiddleware, adminMiddleware, deleteMinimumTempData);

export default router;
