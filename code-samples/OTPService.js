/**
 * OTPService
 * ----------------------------------------
 * Handles OTP generation, email delivery,
 * database storage, and verification.
 *
 * Features:
 * - 6-digit OTP generation
 * - Email-based OTP delivery
 * - Expiry validation (10 minutes)
 * - One-time OTP consumption
 */

const nodemailer = require("nodemailer");
const pool = require("../config/db");

/**
 * Generate a random 6-digit OTP
 */
const generateOTP = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via email
 */
const sendOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Registration OTP",
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch {
    throw new Error("Failed to send OTP email");
  }
};

/**
 * Save or update OTP with expiry (10 minutes)
 */
const saveOrUpdateOTP = async (email, otp) => {
  const query = `
    INSERT INTO otps (email_id, otp, expiry_time)
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ON DUPLICATE KEY UPDATE
      otp = VALUES(otp),
      expiry_time = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
  `;

  return new Promise((resolve, reject) => {
    pool.query(query, [email, otp], (err, results) => {
      if (err) {
        return reject(new Error("Database error while saving OTP"));
      }
      resolve(results);
    });
  });
};

/**
 * Verify OTP and delete after successful validation
 */
const verifyOTP = async (email, enteredOTP) => {
  const query = `
    SELECT otp_id FROM otps
    WHERE email_id = ?
      AND otp = ?
      AND expiry_time > NOW()
    LIMIT 1
  `;

  return new Promise((resolve, reject) => {
    pool.query(query, [email, enteredOTP], (err, results) => {
      if (err) {
        return reject(new Error("Database error while verifying OTP"));
      }

      if (results.length === 0) {
        return resolve(false);
      }

      const deleteQuery = "DELETE FROM otps WHERE otp_id = ?";

      pool.query(deleteQuery, [results[0].otp_id], (deleteErr) => {
        if (deleteErr) {
          return reject(new Error("Database error while deleting OTP"));
        }
        resolve(true);
      });
    });
  });
};

module.exports = {
  generateOTP,
  sendOTP,
  saveOrUpdateOTP,
  verifyOTP,
};
