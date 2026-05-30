import express from "express";
import {
  getForecastLocations,
  getForecastSummary,
  getForecastUpazilas,
} from "../controllers/forecastSummaryController.js";
import { authMiddleware, guestOrUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/upazilas", authMiddleware, guestOrUserMiddleware, getForecastUpazilas);
router.get("/locations", authMiddleware, guestOrUserMiddleware, getForecastLocations);
router.get("/", authMiddleware, guestOrUserMiddleware, getForecastSummary);

export default router;
