import express from "express";
import { uploadEvapoTranspirationData, getAllEvapoTranspirationData, getStations, getYears, getEvapoTranspirationDataById, createEvapoTranspirationData, updateEvapoTranspirationData, deleteEvapoTranspirationData } from "../controllers/evapoTranspirationController.js";

const router = express.Router();

router.post("/upload", uploadEvapoTranspirationData);
router.get("/", getAllEvapoTranspirationData);
router.get("/stations", getStations);
router.get("/years", getYears);
router.get("/:id", getEvapoTranspirationDataById);
router.post("/", createEvapoTranspirationData);
router.put("/:id", updateEvapoTranspirationData);
router.delete("/:id", deleteEvapoTranspirationData);

export default router;
