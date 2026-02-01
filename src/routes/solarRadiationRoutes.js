import express from "express";
import { uploadSolarRadiationData, getAllSolarRadiationData, getStations, getYears, getSolarRadiationDataById, createSolarRadiationData, updateSolarRadiationData, deleteSolarRadiationData } from "../controllers/solarRadiationController.js";

const router = express.Router();

router.post("/upload", uploadSolarRadiationData);
router.get("/", getAllSolarRadiationData);
router.get("/stations", getStations);
router.get("/years", getYears);
router.get("/:id", getSolarRadiationDataById);
router.post("/", createSolarRadiationData);
router.put("/:id", updateSolarRadiationData);
router.delete("/:id", deleteSolarRadiationData);

export default router;
