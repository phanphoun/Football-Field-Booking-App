const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Middleware
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock data storage (in-memory)
const users = [];
const bookings = [];
const fields = [];
let userIdCounter = 1;
let bookingIdCounter = 1;
let fieldIdCounter = 1;

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_RESENDS = 3;
const otpStore = new Map();
const RESET_TTL_MS = 30 * 60 * 1000;
const resetTokenStore = new Map();

const normalizeIdentifier = (value = '') => String(value).trim().toLowerCase();
const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateResetToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const handleResetLinkRequest = (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const user = users.find((u) => u.email?.toLowerCase() === identifier);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }

  const token = generateResetToken();
  resetTokenStore.set(token, { userId: user.id, expiresAt: Date.now() + RESET_TTL_MS });
  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  console.log(`[reset] Send reset link to ${identifier}: ${resetLink}`);

  return res.json({ success: true, message: 'Password reset link sent.', resetLink });
};

const handleResetWithToken = (req, res) => {
  const token = String(req.body?.token || '').trim();
  const newPassword = String(req.body?.newPassword || '').trim();

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
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
  return res.json({ success: true, message: 'Password reset successfully.' });
};

const handleForgotPassword = (req, res) => {
  const identifier = normalizeIdentifier(req.body?.identifier);
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Email or phone is required' });
  }

  const user = users.find((u) => u.email?.toLowerCase() === identifier || u.phone === identifier);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' });
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

  return res.json({ success: true, message: 'OTP sent successfully.' });
};

const handleVerifyOtp = (req, res) => {
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

  return res.json({ success: true, message: 'OTP verified.' });
};

const handleResetPassword = (req, res) => {
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

  const user = users.find((u) => u.email?.toLowerCase() === identifier || u.phone === identifier);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }

  otpStore.delete(identifier);
  return res.json({ success: true, message: 'Password reset successfully.' });
};

// Initialize some mock users
users.push(
  {
    id: userIdCounter++,
    firstName: 'Samart',
    lastName: 'User',
    username: 'samart',
    email: 'samartCute168@gmail.com',
    role: 'player',
    createdAt: new Date().toISOString()
  },
  {
    id: userIdCounter++,
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  }
);

// Initialize some mock fields
fields.push(
  {
    id: fieldIdCounter++,
    name: 'Downtown Arena',
    address: '123 Main St',
    pricePerHour: 50.00,
    description: 'Professional football field with lights',
    image: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Downtown+Arena'
  },
  {
    id: fieldIdCounter++,
    name: 'City Park Field',
    address: '456 Park Ave',
    pricePerHour: 35.00,
    description: 'Community field with basic amenities',
    image: 'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=City+Park+Field'
  },
  {
    id: fieldIdCounter++,
    name: 'Sports Complex',
    address: '789 Sports Blvd',
    pricePerHour: 75.00,
    description: 'Premium facility with locker rooms',
    image: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Sports+Complex'
  }
);

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request:', req.body);
    
    const { firstName, lastName, username, email, password, phone, role } = req.body;
    
    // Basic validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    // Create new user
    const newUser = {
      id: userIdCounter++,
      firstName,
      lastName,
      username,
      email,
      phone: phone || null,
      role: role || 'player',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Generate mock token
    const token = 'mock-jwt-token-' + Date.now() + '-' + newUser.id;
    
    console.log('User registered successfully:', newUser);
    
    // Simulate network delay
    setTimeout(() => {
      res.json({
        success: true,
        data: {
          user: newUser,
          token
        }
      });
    }, 800);
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Accept either username or email
    const loginIdentifier = username || email;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/Username and password are required'
      });
    }
    
    // Find user by username or email
    const user = users.find(u => u.username === loginIdentifier || u.email === loginIdentifier);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Generate mock token
    const token = 'mock-jwt-token-' + Date.now() + '-' + user.id;
    
    console.log('User logged in:', user);
    
    res.json({
      success: true,
      data: {
        user,
        token
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

// Alias routes without /api for compatibility
app.post('/auth/forgot-password', handleForgotPassword);
app.post('/auth/forgot-password/verify', handleVerifyOtp);
app.post('/auth/forgot-password/reset', handleResetPassword);
app.post('/auth/forgot-password-link', handleResetLinkRequest);
app.post('/auth/reset-password', handleResetWithToken);

app.post('/api/auth/forgot-password', handleForgotPassword);
app.post('/api/auth/forgot-password/verify', handleVerifyOtp);
app.post('/api/auth/forgot-password/reset', handleResetPassword);
app.post('/api/auth/forgot-password-link', handleResetLinkRequest);
app.post('/api/auth/reset-password', handleResetWithToken);

app.get('/api/auth/profile', (req, res) => {
  // Mock profile - in real app this would use token to identify user
  const mockUser = users[0] || {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'player'
  };
  
  res.json({
    success: true,
    data: mockUser
  });
});

// Booking routes
app.get('/api/bookings', (req, res) => {
  try {
    const { status, userId } = req.query;
    let filteredBookings = [...bookings];
    
    if (status && status !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.status === status);
    }
    
    if (userId) {
      filteredBookings = filteredBookings.filter(b => b.creator.id == userId);
    }
    
    // Sort by creation date (newest first)
    filteredBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      data: filteredBookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { fieldId, startTime, endTime, teamId, notes } = req.body;
    
    if (!fieldId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Field, start time, and end time are required'
      });
    }
    
    const field = fields.find(f => f.id === fieldId);
    if (!field) {
      return res.status(404).json({
        success: false,
        error: 'Field not found'
      });
    }
    
    // Calculate duration and price
    const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60); // hours
    const totalPrice = duration * field.pricePerHour;
    
    const newBooking = {
      id: bookingIdCounter++,
      field,
      startTime,
      endTime,
      status: 'pending',
      totalPrice,
      notes: notes || '',
      creator: users[0] || { id: 1, username: 'testuser', firstName: 'Test', lastName: 'User' },
      createdAt: new Date().toISOString()
    };
    
    if (teamId) {
      newBooking.team = { id: teamId, name: 'Test Team' };
    }
    
    bookings.push(newBooking);
    
    console.log('New booking created:', newBooking);
    
    res.json({
      success: true,
      data: newBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
});

app.put('/api/bookings/:id', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;
    
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    bookings[bookingIndex].status = status;
    bookings[bookingIndex].updatedAt = new Date().toISOString();
    
    console.log(`Booking ${bookingId} updated to status: ${status}`);
    
    res.json({
      success: true,
      data: bookings[bookingIndex]
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking'
    });
  }
});

app.patch('/api/bookings/:id/confirm', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    booking.status = 'confirmed';
    booking.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm booking'
    });
  }
});

app.patch('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking'
    });
  }
});

app.patch('/api/bookings/:id/complete', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }
    
    booking.status = 'completed';
    booking.updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete booking'
    });
  }
});

// Fields routes
app.get('/api/fields', (req, res) => {
  try {
    res.json({
      success: true,
      data: fields
    });
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fields'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    users: users.length
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🔐 Auth endpoints:');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/auth/profile');
    console.log('❤️  Health check: GET /api/health');
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed.');
      process.exit(0);
    });
  });

  return server;
};

const server = startServer();
