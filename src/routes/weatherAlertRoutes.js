import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getLocalWeatherAlert,
  getLocalWeatherAlertLocations,
} from "../controllers/weatherAlertController.js";

const router = express.Router();

router.get("/locations", authMiddleware, getLocalWeatherAlertLocations);
router.get("/", authMiddleware, getLocalWeatherAlert);

export default router;
