const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const logger = require("../config/logger");

const router = express.Router();

const uploadsDir = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = `${Date.now()}_${Math.random().toString(16).slice(2)}`.replace(/[^a-z0-9-_]/gi, "_");
    cb(null, `${base}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const type = file.mimetype || "";
  if (type.startsWith("image/") || type.startsWith("video/") || type === "application/pdf") {
    return cb(null, true);
  }
  return cb(new Error("Only images, videos, or PDFs are allowed"), false);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

// POST /api/support/attachments
router.post("/attachments", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }
    const url = `/uploads/${req.file.filename}`;
    return res.status(201).json({
      message: "Upload successful",
      attachment: {
        url,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (err) {
    logger.error("Support attachment upload error", { error: err });
    return res.status(500).json({ message: "Failed to upload attachment" });
  }
});

module.exports = router;
