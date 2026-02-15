/**
 * OTPController
 * ----------------------------------------
 * Handles OTP generation, email delivery,
 * verification, and JWT token issuance.
 *
 * Features:
 * - Secure OTP generation
 * - Email-based OTP delivery
 * - OTP verification
 * - JWT token generation
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const {
  sendOTP,
  saveOrUpdateOTP,
  generateOTP,
  verifyOTP,
} = require("../services/OTPService");

const router = express.Router();

/**
 * POST /request-otp
 * Generate and send OTP to user email
 */
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const otp = await generateOTP();

    await sendOTP(email, otp);
    await saveOrUpdateOTP(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to process OTP request",
    });
  }
});

/**
 * POST /verify-otp
 * Verify OTP and generate JWT token
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, ccatFormNo } = req.body;

    if (!email || !otp || !ccatFormNo) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const isVerified = await verifyOTP(email, otp);

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Token configuration error",
      });
    }

    const token = jwt.sign(
      { ccatFormNo },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
    });

  } catch {
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
    });
  }
});

module.exports = router;
