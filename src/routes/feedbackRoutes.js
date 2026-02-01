import express from "express";
import {
  createFeedback,
  getAllFeedbacks,
  getMyFeedbacks,
  deleteFeedback,
} from "../controllers/feedbackController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// User routes
router.post("/", authMiddleware, createFeedback);
router.get("/my-feedbacks", authMiddleware, getMyFeedbacks);

// Admin routes
router.get("/", authMiddleware, adminMiddleware, getAllFeedbacks);
router.delete("/:id", authMiddleware, adminMiddleware, deleteFeedback);

export default router;
