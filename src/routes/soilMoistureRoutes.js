import express from "express";
import { uploadSoilMoistureData, getAllSoilMoistureData, getStations, getYears, getSoilMoistureDataById, createSoilMoistureData, updateSoilMoistureData, deleteSoilMoistureData } from "../controllers/soilMoistureController.js";

const router = express.Router();

router.post("/upload", uploadSoilMoistureData);
router.get("/", getAllSoilMoistureData);
router.get("/stations", getStations);
router.get("/years", getYears);
router.get("/:id", getSoilMoistureDataById);
router.post("/", createSoilMoistureData);
router.put("/:id", updateSoilMoistureData);
router.delete("/:id", deleteSoilMoistureData);

export default router;
