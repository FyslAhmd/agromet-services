import express from "express";
import {
  getForecastLocations,
  getForecastSummary,
  getForecastUpazilas,
} from "../controllers/forecastSummaryController.js";
import { dualAuthMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/upazilas", dualAuthMiddleware, getForecastUpazilas);
router.get("/locations", dualAuthMiddleware, getForecastLocations);
router.get("/", dualAuthMiddleware, getForecastSummary);

export default router;
