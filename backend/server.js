const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const axios = require("axios");
const { sequelize } = require('./src/models');
const serverConfig = require('./src/config/serverConfig');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { generalLimiter, authLimiter, searchLimiter, createLimiter } = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const fieldRoutes = require('./src/routes/fieldRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const teamMemberRoutes = require('./src/routes/teamMemberRoutes');
const publicTeamRoutes = require('./src/routes/publicTeamRoutes');
const matchResultRoutes = require('./src/routes/matchResultRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const API_KEY = "88aaa20e57db47deb4847097dcf9c6a4"; // Using API key directly for now
const BASE_URL = "https://api.football-data.org/v4";
const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Bangkok";

const leagues = [
  { code: "PL", name: "Premier League" },
  { code: "PD", name: "La Liga" },
  { code: "SA", name: "Serie A" },
  { code: "BL1", name: "Bundesliga" },
  { code: "FL1", name: "Ligue 1" }
];

const leagueCache = {
  matches: new Map(),
  standings: new Map()
};

const getCachedValue = (bucket, key) => {
  const entry = bucket.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    bucket.delete(key);
    return null;
  }
  return entry.value;
};

const setCachedValue = (bucket, key, value, ttlMs) => {
  bucket.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
};

const formatDateHeader = (utcDate) => {
  return new Date(utcDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
};

const formatMatchTime = (utcDate) => {
  return new Date(utcDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getDatePartsInTimezone = (value, timeZone) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(new Date(value));
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  const day = Number(parts.find(part => part.type === "day")?.value);
  return { year, month, day };
};

const formatDateKeyInTimezone = (value, timeZone) => {
  const { year, month, day } = getDatePartsInTimezone(value, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const getTodayAnchorInTimezone = (timeZone) => {
  const { year, month, day } = getDatePartsInTimezone(new Date(), timeZone);
  return new Date(Date.UTC(year, month - 1, day));
};

const app = express();
const PORT = serverConfig.port;

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(serverConfig.security.helmet));
app.use(cors(serverConfig.cors));
app.use(compression());

// Rate limiting
if (serverConfig.security.rateLimiting.enabled) {
  app.use(generalLimiter);
}

// Logging middleware
app.use(morgan(serverConfig.logging.format));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============= API ROUTES =============

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: serverConfig.nodeEnv,
    version: '2.0.0'
  });
});

// API Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Football Field Booking API',
    version: '2.0.0',
    environment: serverConfig.nodeEnv,
    endpoints: {
      health: 'GET /health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile'
      },
      users: '/api/users',
      fields: '/api/fields',
      bookings: '/api/bookings',
      teams: '/api/teams',
      publicTeams: '/api/public/teams',
      teamMembers: '/api/team-members',
      matchResults: '/api/match-results',
      notifications: '/api/notifications',
      ratings: '/api/ratings',
      dashboard: {
        stats: 'GET /api/dashboard/stats',
        search: 'GET /api/dashboard/search'
      }
    }
  });
});

// Apply authentication rate limiting
app.use('/api/auth', authLimiter);

// Apply search rate limiting
app.use('/api/dashboard/search', searchLimiter);

// Apply creation rate limiting
app.use('/api', createLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/public/teams', publicTeamRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/match-results', matchResultRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// League API Routes
app.get("/api/matches", async (req, res) => {
  try {
    const { league } = req.query; // Get league filter from query params
    const cacheKey = `matches:${league || "ALL"}`;
    const cachedMatches = getCachedValue(leagueCache.matches, cacheKey);
    if (cachedMatches) {
      return res.json(cachedMatches);
    }
    const matchesByDate = {};
    
    let matchCount = 0;
    const maxMatches = 100;
    const todayAnchor = getTodayAnchorInTimezone(APP_TIMEZONE);
    const startDate = new Date(todayAnchor);
    startDate.setUTCDate(todayAnchor.getUTCDate() - 1); // yesterday
    const validDates = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + offset);
      return formatDateKeyInTimezone(date, APP_TIMEZONE);
    });
    
    // Filter leagues if specific league is requested
    const leaguesToFetch = league ? [leagues.find(l => l.code === league)] : leagues;
    
    for (const leagueData of leaguesToFetch) {
      if (!leagueData) continue; // Skip if league not found
      
      const response = await axios.get(
        `${BASE_URL}/competitions/${leagueData.code}/matches`,
        { headers: { "X-Auth-Token": API_KEY } }
      );
      const leagueMatches = response.data.matches || [];
      for (const match of leagueMatches) {
        if (matchCount >= maxMatches) break;
        const matchDate = new Date(match.utcDate);
        const dateKey = formatDateKeyInTimezone(matchDate, APP_TIMEZONE);
        if (!validDates.includes(dateKey)) continue;
        if (!matchesByDate[dateKey]) {
          matchesByDate[dateKey] = {
            date: formatDateHeader(match.utcDate),
            dateISO: dateKey,
            matches: []
          };
        }
        matchesByDate[dateKey].matches.push({
          id: match.id,
          competition: leagueData.name,
          dateTime: match.utcDate,
          time: formatMatchTime(match.utcDate),
          homeTeam: {
            name: match.homeTeam.name,
            logo: match.homeTeam.crest || null,
            score: match.score.fullTime.home !== null ? match.score.fullTime.home : null
          },
          awayTeam: {
            name: match.awayTeam.name,
            logo: match.awayTeam.crest || null,
            score: match.score.fullTime.away !== null ? match.score.fullTime.away : null
          },
          status: match.status,
          matchDay: match.matchday
        });
        matchCount++;
        if (matchCount >= maxMatches) break;
      }
      if (matchCount >= maxMatches) break;
    }
    // Sort by date and return as array
    const sortedMatches = Object.keys(matchesByDate)
      .sort()
      .map(date => matchesByDate[date]);
    setCachedValue(leagueCache.matches, cacheKey, sortedMatches, 60 * 1000);
    res.json(sortedMatches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leagues/standings", async (req, res) => {
  try {
    const { league } = req.query;
    const selectedLeagues = league
      ? leagues.filter(item => item.code === league)
      : leagues;

    if (selectedLeagues.length === 0) {
      return res.status(400).json({ error: "Invalid league code" });
    }

    const standingsByLeague = {};
    
    for (const leagueData of selectedLeagues) {
      const cacheKey = `standings:${leagueData.code}`;
      const cachedStandings = getCachedValue(leagueCache.standings, cacheKey);
      if (cachedStandings) {
        standingsByLeague[leagueData.code] = cachedStandings;
        continue;
      }

      const response = await axios.get(
        `${BASE_URL}/competitions/${leagueData.code}/standings`,
        { headers: { "X-Auth-Token": API_KEY } }
      );
      
      const standings = response.data.standings?.[0]?.table || [];
      
      const formattedStandings = {
        league: leagueData.name,
        code: leagueData.code,
        table: standings.map(team => ({
          position: team.position,
          team: team.team.name,
          logo: team.team.crest,
          playedGames: team.playedGames,
          won: team.won,
          draw: team.draw,
          lost: team.lost,
          points: team.points,
          form: team.form || ""
        }))
      };

      standingsByLeague[leagueData.code] = formattedStandings;
      setCachedValue(leagueCache.standings, cacheKey, formattedStandings, 5 * 60 * 1000);
    }
    
    res.json(standingsByLeague);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware (must be after routes)
app.use(notFound);
app.use(errorHandler);

// ============= Start Server =============
const startServer = async () => {
  try {
    // Database connection check
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    
    // Environment-safe database sync
    const isDevelopment = serverConfig.nodeEnv === 'development';
    const isTest = serverConfig.nodeEnv === 'test';
    
    if (isDevelopment) {
      // In development, sync without alter to prevent index accumulation
      console.log('🔄 Development mode: Synchronizing database schema...');
      await sequelize.sync();
      console.log('✅ Database schema synchronized successfully.');
    } else if (isTest) {
      // In test mode, force recreate for clean state
      console.log('🧪 Test mode: Recreating database...');
      await sequelize.sync({ force: true });
      console.log('✅ Test database recreated successfully.');
    } else {
      // In production, only sync without alterations
      console.log('🚀 Production mode: Synchronizing database safely...');
      await sequelize.sync();
      console.log('✅ Database synchronized safely.');
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📝 Environment: ${serverConfig.nodeEnv}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('💡 Please check your database configuration and ensure MySQL is running.');
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
