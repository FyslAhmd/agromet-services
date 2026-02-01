import { Router } from "express";
import { 
  getUsers, 
  registerUser, 
  loginUser,
  approveUser,
  rejectUser, 
  getUserById, 
  updateUser, 
  deleteUser,
  getCurrentUser,
  changePassword
} from "../controllers/userController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (require authentication)
router.get("/current", authMiddleware, getCurrentUser);
router.get("/:userId", authMiddleware, getUserById);
router.put("/:userId", authMiddleware, updateUser);
router.put("/:userId/password", authMiddleware, changePassword);

// Admin only routes
router.get("/", authMiddleware, adminMiddleware, getUsers);
router.patch("/:userId/approve", authMiddleware, adminMiddleware, approveUser);
router.patch("/:userId/reject", authMiddleware, adminMiddleware, rejectUser);
router.delete("/:userId", authMiddleware, adminMiddleware, deleteUser);

export default router;
