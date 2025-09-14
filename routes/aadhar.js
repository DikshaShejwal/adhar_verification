const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const crypto = require('crypto');

const router = express.Router();

// Shared uploads folder
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer for file upload
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 5 * 1024 * 1024 } });

// ✅ Shared session map
const otpSessions = new Map();

// Extract Aadhaar number from text
function extractAadhaarFromText(text) {
  const matches = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/g);
  return matches ? matches[0].replace(/\s/g, '') : "Not detected";
}

// Extract Name from text
function extractNameFromText(text) {
  const lines = text.split('\n').map(l => l.trim());
  for (const line of lines) {
    // Return first uppercase line without digits
    if (/^[A-Z\s]+$/.test(line) && !/\d/.test(line)) return line;
  }
  return "Not detected";
}



// ----- Step 1: Upload Aadhaar + OCR + send OTP -----
router.post('/verify-aadhaar', upload.any(), async (req, res) => {
  try {
    const file = req.files && req.files[0];
    if (!file) return res.status(400).json({ error: 'Missing Aadhaar image' });

    const imagePath = file.path;
    const result = await Tesseract.recognize(imagePath, 'eng');
    fs.unlinkSync(imagePath);

    const aadhaarNumber = extractAadhaarFromText(result.data.text);
    const name = extractNameFromText(result.data.text);

    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const sessionId = crypto.randomBytes(16).toString('hex');

    // Store session in shared Map
    otpSessions.set(sessionId, {
      aadhaar: aadhaarNumber,
      name,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
      attempts: 0
    });

    console.log("SESSION STORED:", otpSessions.get(sessionId));
    console.log(`SIMULATED OTP ${otp} for Aadhaar ${aadhaarNumber}`);

    res.json({ success: true, message: 'Aadhaar matched. OTP sent', sessionId });

  } catch (err) {
    console.error("AADHAAR VERIFY ERROR:", err);
    res.status(500).json({ error: 'internal_server_error' });
  }
});

// ----- Step 2: Confirm OTP -----
router.post('/confirm-otp', (req, res) => {
  const { sessionId, otp } = req.body;
  const session = otpSessions.get(sessionId);

  console.log("CONFIRM OTP BODY:", req.body);
  console.log("SESSION FOUND:", session);

  if (!session) return res.status(400).json({ error: 'invalid_session' });
  if (Date.now() > session.expiresAt) {
    otpSessions.delete(sessionId);
    return res.status(400).json({ error: 'expired' });
  }
  if (session.otp !== otp) {
    session.attempts++;
    return res.status(400).json({ error: 'invalid_otp' });
  }

  otpSessions.delete(sessionId);

  return res.json({
    success: true,
    message: 'Verification successful',
    data: {
      number: session.aadhaar,
      name: session.name
    }
  });
});

module.exports = router;
