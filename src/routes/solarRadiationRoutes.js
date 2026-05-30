import express from "express";
import { uploadSolarRadiationData, getAllSolarRadiationData, getStations, getYears, getSolarRadiationDataById, createSolarRadiationData, updateSolarRadiationData, deleteSolarRadiationData } from "../controllers/solarRadiationController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, adminMiddleware, uploadSolarRadiationData);
router.get("/", authMiddleware, registeredUserMiddleware, getAllSolarRadiationData);
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);
router.get("/:id", authMiddleware, registeredUserMiddleware, getSolarRadiationDataById);
router.post("/", authMiddleware, adminMiddleware, createSolarRadiationData);
router.put("/:id", authMiddleware, adminMiddleware, updateSolarRadiationData);
router.delete("/:id", authMiddleware, adminMiddleware, deleteSolarRadiationData);

export default router;
