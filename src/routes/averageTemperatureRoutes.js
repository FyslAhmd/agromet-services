import express from "express";
import { uploadAverageTemperatureData, getAllAverageTemperatureData, getStations, getYears, getAverageTemperatureDataById, createAverageTemperatureData, updateAverageTemperatureData, deleteAverageTemperatureData } from "../controllers/averageTemperatureController.js";

const router = express.Router();

router.post("/upload", uploadAverageTemperatureData);
router.get("/", getAllAverageTemperatureData);
router.get("/stations", getStations);
router.get("/years", getYears);
router.get("/:id", getAverageTemperatureDataById);
router.post("/", createAverageTemperatureData);
router.put("/:id", updateAverageTemperatureData);
router.delete("/:id", deleteAverageTemperatureData);

export default router;
