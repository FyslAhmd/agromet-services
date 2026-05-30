import express from "express";
import { uploadSoilTemperatureData, getAllSoilTemperatureData, getStations, getYears, getSoilTemperatureDataById, createSoilTemperatureData, updateSoilTemperatureData, deleteSoilTemperatureData } from "../controllers/soilTemperatureController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, adminMiddleware, uploadSoilTemperatureData);
router.get("/", authMiddleware, registeredUserMiddleware, getAllSoilTemperatureData);
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);
router.get("/:id", authMiddleware, registeredUserMiddleware, getSoilTemperatureDataById);
router.post("/", authMiddleware, adminMiddleware, createSoilTemperatureData);
router.put("/:id", authMiddleware, adminMiddleware, updateSoilTemperatureData);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSoilTemperatureData);

export default router;
