const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mock auth routes
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
