import express from "express";
import { uploadEvapoTranspirationData, getAllEvapoTranspirationData, getStations, getYears, getEvapoTranspirationDataById, createEvapoTranspirationData, updateEvapoTranspirationData, deleteEvapoTranspirationData } from "../controllers/evapoTranspirationController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, adminMiddleware, uploadEvapoTranspirationData);
router.get("/", authMiddleware, registeredUserMiddleware, getAllEvapoTranspirationData);
router.get("/stations", authMiddleware, registeredUserMiddleware, getStations);
router.get("/years", authMiddleware, registeredUserMiddleware, getYears);
router.get("/:id", authMiddleware, registeredUserMiddleware, getEvapoTranspirationDataById);
router.post("/", authMiddleware, adminMiddleware, createEvapoTranspirationData);
router.put("/:id", authMiddleware, adminMiddleware, updateEvapoTranspirationData);
router.delete("/:id", authMiddleware, adminMiddleware, deleteEvapoTranspirationData);

export default router;
