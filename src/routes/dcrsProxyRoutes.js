import express from "express";
import axios from "axios";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const DCRS_API_URL = process.env.DCRS_API_URL || "https://dcrs.brri.gov.bd";

// Proxy all secondary-data-requests to DCRS
// GET /api/dcrs-proxy/secondary-data-requests
router.get("/secondary-data-requests", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let url = `${DCRS_API_URL}/api/secondary-data-requests`;
    if (status && status !== "all") {
      url += `?status=${status}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("DCRS Proxy Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Failed to fetch data from DCRS",
    });
  }
});

// Accept a request
// PATCH /api/dcrs-proxy/secondary-data-requests/:id/accept
router.patch("/secondary-data-requests/:id/accept", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(
      `${DCRS_API_URL}/api/secondary-data-requests/${id}/accept`,
      {},
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("DCRS Proxy Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Failed to accept request",
    });
  }
});

// Reject a request
// PATCH /api/dcrs-proxy/secondary-data-requests/:id/reject
router.patch("/secondary-data-requests/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(
      `${DCRS_API_URL}/api/secondary-data-requests/${id}/reject`,
      req.body,
      {
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("DCRS Proxy Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Failed to reject request",
    });
  }
});

export default router;
