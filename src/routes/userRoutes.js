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
  changePassword,
  uploadProfilePicture,
  removeProfilePicture,
  guestLoginUser,
  getGuestLogs
} from "../controllers/userController.js";
import { authMiddleware, adminMiddleware, registeredUserMiddleware } from "../middleware/authMiddleware.js";
import { profilePictureUpload } from "../middleware/uploadMiddleware.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/guest-login", guestLoginUser);

// Protected routes (require authentication)
router.get("/current", authMiddleware, getCurrentUser);
router.get("/guest-logs", authMiddleware, adminMiddleware, getGuestLogs);
router.get("/:userId", authMiddleware, registeredUserMiddleware, getUserById);
router.put("/:userId", authMiddleware, registeredUserMiddleware, updateUser);
router.put("/:userId/password", authMiddleware, registeredUserMiddleware, changePassword);
router.post("/:userId/profile-picture", authMiddleware, registeredUserMiddleware, profilePictureUpload.single("profilePicture"), uploadProfilePicture);
router.delete("/:userId/profile-picture", authMiddleware, registeredUserMiddleware, removeProfilePicture);

// Admin only routes
router.get("/", authMiddleware, adminMiddleware, getUsers);
router.patch("/:userId/approve", authMiddleware, adminMiddleware, approveUser);
router.patch("/:userId/reject", authMiddleware, adminMiddleware, rejectUser);
router.delete("/:userId", authMiddleware, adminMiddleware, deleteUser);

export default router;
