import Feedback from "../models/Feedback.js";
import User from "../models/User.js";

// Create feedback
export const createFeedback = async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const userId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    if (!feedback || feedback.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Feedback text is required",
      });
    }

    // Get user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newFeedback = await Feedback.create({
      userId,
      userName: user.name,
      userEmail: user.email,
      feedback: feedback.trim(),
      rating,
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully!",
      data: newFeedback,
    });
  } catch (error) {
    console.error("Create Feedback Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};

// Get all feedbacks (admin only)
export const getAllFeedbacks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const rating = req.query.rating;

    const whereClause = {};
    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    const { count, rows: feedbacks } = await Feedback.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: feedbacks,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get Feedbacks Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedbacks",
      error: error.message,
    });
  }
};

// Get user's own feedbacks
export const getMyFeedbacks = async (req, res) => {
  try {
    const userId = req.user.id;

    const feedbacks = await Feedback.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Get My Feedbacks Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your feedbacks",
      error: error.message,
    });
  }
};

// Delete feedback (admin only)
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    await feedback.destroy();

    res.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Delete Feedback Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete feedback",
      error: error.message,
    });
  }
};
