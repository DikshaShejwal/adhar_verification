// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet());
app.use(express.json());

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// serve frontend static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// simple in-memory session store for OTPs (production: use Redis)
const otpSessions = new Map();

// rate limiter (basic)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many requests, slow down' }
});
app.use('/api/', limiter);

// multer setup
const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// utils
function normalizeAadhaar(s) {
  if(!s) return null;
  const digits = s.replace(/\D/g, '');
  return digits.length === 12 ? digits : null;
}
function extractAadhaarFromText(text) {
  if (!text) return null;
  const regex = /(?:\d{4}\s?\d{4}\s?\d{4}|\d{12})/g;
  const matches = text.match(regex);
  if (!matches) return null;
  for (let m of matches) {
    const n = m.replace(/\D/g, '');
    if (n.length === 12) return n;
  }
  return null;
}

// pluggable SMS sender (simulated by default)
async function sendOtpSms(aadhaarNumber, phone, otp) {
  // If you configure Twilio env vars, you can send real SMS.
  // For now we simulate:
  console.log(`SIMULATED SMS -> OTP ${otp} for Aadhaar ${aadhaarNumber} to phone ${phone || '(none)'}`);
  return true;
}

// POST /api/verify-aadhaar  (multipart form: aadhaarImage + aadhaarNumber + phone optional)
app.post('/api/verify-aadhaar', upload.single('aadhaarImage'), async (req, res) => {
  try {
    const entered = req.body.aadhaarNumber;
    const phone = req.body.phone;
    if (!entered) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'aadhaarNumber is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'aadhaarImage file is required' });
    }

    const normalizedEntered = normalizeAadhaar(entered);
    if (!normalizedEntered) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Provided Aadhaar number must be 12 digits' });
    }

    const imagePath = req.file.path;
    // OCR using tesseract.js
    const result = await Tesseract.recognize(imagePath, 'eng', { logger: m => {/* optional */} });
    const ocrText = result && result.data && result.data.text ? result.data.text : '';

    // delete image immediately after OCR
    try { fs.unlinkSync(imagePath); } catch(e) {}

    const extracted = extractAadhaarFromText(ocrText);
    if (!extracted) {
      return res.status(400).json({ error: 'Could not find a 12-digit Aadhaar number in the image. Upload clearer image.' });
    }
    if (extracted !== normalizedEntered) {
      return res.status(400).json({
        error: 'AADHAAR_MISMATCH',
        message: 'The Aadhaar number in the image does not match the entered number.'
        // avoid sending extracted number in production logs
      });
    }

    // generate OTP + session
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const sessionId = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min TTL

    otpSessions.set(sessionId, { aadhaar: extracted, otp, expiresAt, attempts: 0 });

    // send SMS (or simulate)
    await sendOtpSms(extracted, phone, otp);

    return res.json({ success: true, message: 'Aadhaar matched. OTP sent (simulated).', sessionId, ttl: 5*60 });
  } catch (err) {
    console.error('verify-aadhaar error:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

// POST /api/confirm-otp  { sessionId, otp }
app.post('/api/confirm-otp', (req, res) => {
  try {
    const { sessionId, otp } = req.body;
    if (!sessionId || !otp) return res.status(400).json({ error: 'sessionId and otp required' });

    const session = otpSessions.get(sessionId);
    if (!session) return res.status(400).json({ error: 'invalid_session' });

    if (Date.now() > session.expiresAt) {
      otpSessions.delete(sessionId);
      return res.status(400).json({ error: 'expired' });
    }

    session.attempts = (session.attempts || 0) + 1;
    if (session.attempts > 5) {
      otpSessions.delete(sessionId);
      return res.status(429).json({ error: 'too_many_attempts' });
    }

    if (session.otp !== String(otp).trim()) {
      return res.status(400).json({ error: 'invalid_otp' });
    }

    // success -> persist if you want (DB). For demo we return success.
    otpSessions.delete(sessionId);
    return res.json({ success: true, message: 'Verification successful' });
  } catch (err) {
    console.error('confirm-otp error:', err);
    return res.status(500).json({ error: 'internal_server_error' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
