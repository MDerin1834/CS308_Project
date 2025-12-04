const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const commentService = require("../services/commentService");
const logger = require("../config/logger");

// GET /api/comments/pending
router.get("/pending", auth, authorizeRole("product_manager"), async (req, res) => {
  try {
    const comments = await commentService.getPendingComments();
    return res.status(200).json({ comments });
  } catch (err) {
    logger.error("❌ getPendingComments error", { error: err });
    return res.status(500).json({ message: "Failed to fetch pending comments" });
  }
});

// PATCH /api/comments/:id/approve
router.patch("/:id/approve", auth, authorizeRole("product_manager"), async (req, res) => {
  try {
    const comment = await commentService.approveComment(req.params.id);
    return res.status(200).json({ message: "Comment approved", comment });
  } catch (err) {
    logger.error("❌ approveComment error", { error: err });

    if (err.code === "COMMENT_NOT_FOUND")
      return res.status(404).json({ message: "Comment not found" });

    return res.status(500).json({ message: "Failed to approve comment" });
  }
});

// PATCH /api/comments/:id/reject
router.patch("/:id/reject", auth, authorizeRole("product_manager"), async (req, res) => {
  try {
    const comment = await commentService.rejectComment(req.params.id);
    return res.status(200).json({ message: "Comment rejected", comment });
  } catch (err) {
    logger.error("❌ rejectComment error", { error: err });

    if (err.code === "COMMENT_NOT_FOUND")
      return res.status(404).json({ message: "Comment not found" });

    return res.status(500).json({ message: "Failed to reject comment" });
  }
});

module.exports = router;
