import express from "express";
import {
  getAllHistoricalDataRequests,
  createHistoricalDataRequest,
  updateHistoricalDataRequestStatus,
  getHistoricalDataRequestStats,
  getHistoricalDataRequestById
} from "../controllers/historicalDataRequestController.js";

const router = express.Router();

// GET Routes
router.get("/", getAllHistoricalDataRequests);
router.get("/stats", getHistoricalDataRequestStats);
router.get("/:id", getHistoricalDataRequestById);

// POST Routes
router.post("/", createHistoricalDataRequest);

// PUT Routes
router.put("/:id/status", updateHistoricalDataRequestStatus);

export default router;
