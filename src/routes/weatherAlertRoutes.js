import express from "express";
import { authMiddleware, guestOrUserMiddleware } from "../middleware/authMiddleware.js";
import {
  getLocalWeatherAlert,
  getLocalWeatherAlertLocations,
} from "../controllers/weatherAlertController.js";

const router = express.Router();

router.get("/locations", authMiddleware, guestOrUserMiddleware, getLocalWeatherAlertLocations);
router.get("/", authMiddleware, guestOrUserMiddleware, getLocalWeatherAlert);

export default router;
