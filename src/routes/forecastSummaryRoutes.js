import express from "express";
import { getForecastSummary } from "../controllers/forecastSummaryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getForecastSummary);

export default router;
