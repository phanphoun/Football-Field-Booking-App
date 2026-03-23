const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock auth routes
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_RESENDS = 3;
const otpStore = new Map();

const normalizeIdentifier = (value = '') => String(value).trim().toLowerCase();
const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const RESET_TTL_MS = 30 * 60 * 1000;
const resetTokenStore = new Map();
const generateResetToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

app.post('/api/auth/register', (req, res) => {
  console.log('Mock registration received:', JSON.stringify(req.body, null, 2));
  
  try {
    const { firstName, lastName, username, email, password, role } = req.body;
    
    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }
    
    // Simulate successful registration
    setTimeout(() => {
      res.json({
        success: true,
        data: {
          user: {
            id: Math.floor(Math.random() * 1000) + 1,
            firstName,
            lastName,
            username,
            email,
            role: role || 'player'
          },
          token: 'mock-jwt-token-' + Date.now()
        }
      });
    }, 1000); // Simulate network delay
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  console.log('Mock login received:', req.body);
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: 1,
          username,
          email: 'test@example.com',
          role: 'player'
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/forgot-password', (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email or phone is required' });
  }

  const existing = otpStore.get(identifier);
  const resendCount = existing?.resendCount || 0;
  if (resendCount >= OTP_MAX_RESENDS) {
    return res.status(429).json({ success: false, error: 'OTP resend limit reached' });
  }

  const otp = generateOtpCode();
  otpStore.set(identifier, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    resendCount: resendCount + 1
  });

  console.log(`[otp] Send OTP to ${identifier}: ${otp}`);

  res.json({ success: true, message: 'OTP sent successfully.' });
});

app.post('/api/auth/forgot-password/verify', (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  const otp = String(req.body?.otp || '').trim();
  if (!identifier || !otp) {
    return res.status(400).json({ success: false, error: 'Identifier and OTP are required' });
  }

  const entry = otpStore.get(identifier);
  if (!entry) {
    return res.status(400).json({ success: false, error: 'OTP not found. Please request a new one.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(identifier);
    return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
  }

  if (entry.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(identifier);
    return res.status(429).json({ success: false, error: 'Too many attempts. Please request a new OTP.' });
  }

  if (entry.otp !== otp) {
    entry.attempts += 1;
    otpStore.set(identifier, entry);
    return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
  }

  res.json({ success: true, message: 'OTP verified.' });
});

app.post('/api/auth/forgot-password/reset', (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  const otp = String(req.body?.otp || '').trim();
  const newPassword = String(req.body?.newPassword || '').trim();

  if (!identifier || !otp || !newPassword) {
    return res.status(400).json({ success: false, error: 'Identifier, OTP, and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  const entry = otpStore.get(identifier);
  if (!entry) {
    return res.status(400).json({ success: false, error: 'OTP not found. Please request a new one.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(identifier);
    return res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
  }

  if (entry.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP. Please try again.' });
  }

  otpStore.delete(identifier);
  res.json({ success: true, message: 'Password reset successfully.' });
});

app.post('/api/auth/forgot-password-link', (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const token = generateResetToken();
  resetTokenStore.set(token, { expiresAt: Date.now() + RESET_TTL_MS });
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  console.log(`[reset] Send reset link to ${identifier}: ${resetLink}`);

  res.json({ success: true, message: 'Password reset link sent.', resetLink });
});

app.post('/api/auth/reset-password', (req, res) => {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.newPassword || '').trim();
  if (!token || !newPassword) {
    return res.status(400).json({ success: false, error: 'Token and new password are required' });
  }

  const entry = resetTokenStore.get(token);
  if (!entry) {
    return res.status(400).json({ success: false, error: 'Invalid or expired reset token.' });
  }

  if (Date.now() > entry.expiresAt) {
    resetTokenStore.delete(token);
    return res.status(400).json({ success: false, error: 'Reset token expired.' });
  }

  resetTokenStore.delete(token);
  res.json({ success: true, message: 'Password reset successfully.' });
});

// Alias routes without /api for compatibility
app.post('/auth/forgot-password', (req, res) => {
  req.url = '/api/auth/forgot-password';
  app._router.handle(req, res);
});
app.post('/auth/forgot-password/verify', (req, res) => {
  req.url = '/api/auth/forgot-password/verify';
  app._router.handle(req, res);
});
app.post('/auth/forgot-password/reset', (req, res) => {
  req.url = '/api/auth/forgot-password/reset';
  app._router.handle(req, res);
});
app.post('/auth/forgot-password-link', (req, res) => {
  req.url = '/api/auth/forgot-password-link';
  app._router.handle(req, res);
});
app.post('/auth/reset-password', (req, res) => {
  req.url = '/api/auth/reset-password';
  app._router.handle(req, res);
});

app.get('/api/auth/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'player'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock server running on http://localhost:${PORT}`);
  console.log('📝 Registration endpoint: POST /api/auth/register');
  console.log('🔑 Login endpoint: POST /api/auth/login');
  console.log('👤 Profile endpoint: GET /api/auth/profile');
});
