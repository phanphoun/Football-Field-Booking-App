-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  role ENUM('guest', 'player', 'captain', 'field_owner', 'admin') NOT NULL DEFAULT 'player',
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  avatarUrl VARCHAR(255),
  dateOfBirth DATE,
  gender ENUM('male', 'female', 'other'),
  address TEXT,
  emailVerified TINYINT(1) NOT NULL DEFAULT 0,
  lastLogin DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logoUrl VARCHAR(255),
  skillLevel ENUM('beginner', 'intermediate', 'advanced', 'professional') DEFAULT 'beginner',
  captainId INT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (captainId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create fields table
CREATE TABLE IF NOT EXISTS fields (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  pricePerHour DECIMAL(10,2) NOT NULL,
  ownerId INT,
  image VARCHAR(255),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  startTime DATETIME NOT NULL,
  endTime DATETIME NOT NULL,
  totalPrice DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  notes TEXT,
  creatorId INT NOT NULL,
  fieldId INT NOT NULL,
  teamId INT,
  opponentTeamId INT,
  openForOpponents TINYINT(1) DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creatorId) REFERENCES users(id),
  FOREIGN KEY (fieldId) REFERENCES fields(id),
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (opponentTeamId) REFERENCES teams(id) ON DELETE SET NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teamId INT NOT NULL,
  playerId INT NOT NULL,
  role ENUM('member', 'captain') DEFAULT 'member',
  joinedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (playerId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_team_member (teamId, playerId)
);

-- Create role_requests table
CREATE TABLE IF NOT EXISTS role_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  requestedRole ENUM('captain', 'field_owner') NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  note TEXT,
  reviewedBy INT,
  reviewedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (reviewedBy) REFERENCES users(id) ON DELETE SET NULL
);
