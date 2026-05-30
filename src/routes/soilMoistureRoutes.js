import express from "express";
import { uploadSoilMoistureData, getAllSoilMoistureData, getStations, getYears, getSoilMoistureDataById, createSoilMoistureData, updateSoilMoistureData, deleteSoilMoistureData } from "../controllers/soilMoistureController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, adminMiddleware, uploadSoilMoistureData);
router.get("/", authMiddleware, registeredUserMiddleware, getAllSoilMoistureData);
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);
router.get("/:id", authMiddleware, registeredUserMiddleware, getSoilMoistureDataById);
router.post("/", authMiddleware, adminMiddleware, createSoilMoistureData);
router.put("/:id", authMiddleware, adminMiddleware, updateSoilMoistureData);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSoilMoistureData);

export default router;
