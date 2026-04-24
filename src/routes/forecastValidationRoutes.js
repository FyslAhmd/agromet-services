import express from "express";
import {
  getForecastValidation,
  triggerForecastValidationRun,
} from "../controllers/forecastValidationController.js";
import { adminMiddleware, authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getForecastValidation);
router.post("/run", authMiddleware, adminMiddleware, triggerForecastValidationRun);

export default router;
