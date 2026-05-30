import express from "express";
import {
  getAllHistoricalDataRequests,
  createHistoricalDataRequest,
  updateHistoricalDataRequestStatus,
  getHistoricalDataRequestStats,
  getHistoricalDataRequestById
} from "../controllers/historicalDataRequestController.js";
import { adminMiddleware, authMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET Routes
router.get("/", authMiddleware, adminMiddleware, getAllHistoricalDataRequests);
router.get("/stats", authMiddleware, adminMiddleware, getHistoricalDataRequestStats);
router.get("/:id", authMiddleware, adminMiddleware, getHistoricalDataRequestById);

// POST Routes
router.post("/", authMiddleware, registeredUserMiddleware, createHistoricalDataRequest);

// PUT Routes
router.put("/:id/status", authMiddleware, adminMiddleware, updateHistoricalDataRequestStatus);

export default router;
