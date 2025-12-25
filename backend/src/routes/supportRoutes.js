const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const logger = require("../config/logger");

const router = express.Router();

const uploadsDir = path.join(__dirname, "../../public/uploads");
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
  return cb(null, true);
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

function isSafeFilename(name) {
  return /^[a-zA-Z0-9._-]+$/.test(name || "");
}

// DELETE /api/support/attachments/:filename
router.delete("/attachments/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!isSafeFilename(filename)) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const filePath = path.join(uploadsDir, filename);
    await fs.promises.unlink(filePath);
    return res.status(200).json({ message: "Attachment deleted" });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ message: "Attachment not found" });
    }
    logger.error("Support attachment delete error", { error: err });
    return res.status(500).json({ message: "Failed to delete attachment" });
  }
});

router.use((err, _req, res, _next) => {
  if (err?.message === "Only images, videos, or PDFs are allowed") {
    return res.status(400).json({ message: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File is too large" });
  }
  logger.error("Support upload middleware error", { error: err });
  return res.status(500).json({ message: "Upload failed" });
});

module.exports = router;
