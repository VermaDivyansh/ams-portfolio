/**
 * FileController
 * ----------------------------------------
 * Secure file retrieval endpoint.
 *
 * Features:
 * - Encrypted file path handling
 * - File existence validation
 * - Dynamic content-type resolution
 * - Stream-based file delivery
 * - Authentication middleware protection
 */

const express = require("express");
const { isAuthenticated } = require("../middlewares/authenticationMiddleware");
const FileService = require("../services/FileService");

const router = express.Router();

const uploadsPath = process.env.UPLOAD_PATH || "uploads";

/**
 * GET /fetchFile
 * Fetch and stream a file securely using encrypted path.
 */
router.get("/fetchFile", isAuthenticated([]), async (req, res) => {
  try {
    const encryptedFilePath = req?.query?.path;

    if (!encryptedFilePath) {
      return res.status(400).json({
        success: false,
        message: "File path is required",
      });
    }

    // Decrypt file path
    const filePath = FileService.decryptFilePath(encryptedFilePath);

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path",
      });
    }

    // Validate file existence
    const absolutePath = FileService.fileExists(filePath, uploadsPath);

    if (!absolutePath) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Set correct content type
    const contentType = FileService.getContentType(filePath);
    res.setHeader("Content-Type", contentType);

    // Stream file to client
    return FileService.streamFile(absolutePath, res);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process file request",
    });
  }
});

module.exports = router;
