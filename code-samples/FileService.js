/**
 * FileService
 * ----------------------------------------
 * Handles secure file decryption, validation,
 * content-type resolution, and streaming.
 *
 * Features:
 * - Encrypted file path handling
 * - Path traversal protection
 * - File existence validation
 * - Stream-based file delivery
 */

const fs = require("fs");
const path = require("path");
const { decryptData } = require("../encryptionUtils");

class FileService {

  /**
   * Decrypt encrypted file path
   */
  static decryptFilePath(encryptedFilePath) {
    try {
      return decryptData(encryptedFilePath);
    } catch {
      throw new Error("Invalid encrypted file path");
    }
  }

  /**
   * Validate file existence and prevent path traversal
   */
  static fileExists(filePath, uploadsPath) {
    const normalizedPath = path.normalize(filePath);

    // Prevent directory traversal attack
    if (normalizedPath.includes("..")) {
      return null;
    }

    const absolutePath = path.join(uploadsPath, normalizedPath);

    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }

    return null;
  }

  /**
   * Determine content type by extension
   */
  static getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    };

    return mimeTypes[ext] || "application/octet-stream";
  }

  /**
   * Stream file securely
   */
  static streamFile(absolutePath, res) {
    const fileStream = fs.createReadStream(absolutePath);

    fileStream.on("error", () => {
      res.status(500).json({
        success: false,
        message: "Error streaming file",
      });
    });

    fileStream.pipe(res);
  }
}

module.exports = FileService;
