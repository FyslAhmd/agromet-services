import express from "express";
import { uploadSoilTemperatureData, getAllSoilTemperatureData, getStations, getYears, getSoilTemperatureDataById, createSoilTemperatureData, updateSoilTemperatureData, deleteSoilTemperatureData } from "../controllers/soilTemperatureController.js";

const router = express.Router();

router.post("/upload", uploadSoilTemperatureData);
router.get("/", getAllSoilTemperatureData);
router.get("/stations", getStations);
router.get("/years", getYears);
router.get("/:id", getSoilTemperatureDataById);
router.post("/", createSoilTemperatureData);
router.put("/:id", updateSoilTemperatureData);
router.delete("/:id", deleteSoilTemperatureData);

export default router;
