import express from "express";
import { uploadAverageTemperatureData, getAllAverageTemperatureData, getStations, getYears, getAverageTemperatureDataById, createAverageTemperatureData, updateAverageTemperatureData, deleteAverageTemperatureData } from "../controllers/averageTemperatureController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, adminMiddleware, uploadAverageTemperatureData);
router.get("/", authMiddleware, registeredUserMiddleware, getAllAverageTemperatureData);
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);
router.get("/:id", authMiddleware, registeredUserMiddleware, getAverageTemperatureDataById);
router.post("/", authMiddleware, adminMiddleware, createAverageTemperatureData);
router.put("/:id", authMiddleware, adminMiddleware, updateAverageTemperatureData);
router.delete("/:id", authMiddleware, adminMiddleware, deleteAverageTemperatureData);

export default router;
