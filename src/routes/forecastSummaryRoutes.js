import express from "express";
import {
  getForecastLocations,
  getForecastSummary,
  getForecastUpazilas,
} from "../controllers/forecastSummaryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/upazilas", authMiddleware, getForecastUpazilas);
router.get("/locations", authMiddleware, getForecastLocations);
router.get("/", authMiddleware, getForecastSummary);

export default router;
