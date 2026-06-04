import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { uploadProjectionFile, getJobStatus, getProjectionData } from "../controllers/projectionController.js";
import { authMiddleware, adminMiddleware, guestOrUserMiddleware } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Setup Multer for streaming big files to disk
const tempUploadDir = join(__dirname, "..", "..", "uploads", "temp");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Admin-only upload endpoint
router.post("/upload", authMiddleware, adminMiddleware, upload.single('file'), uploadProjectionFile);

// Check job status
router.get("/status/:jobId", authMiddleware, adminMiddleware, getJobStatus);

// View projection data
router.get("/data", authMiddleware, guestOrUserMiddleware, getProjectionData);

export default router;