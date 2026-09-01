/**
 * server.js
 * Entry point for the WildPulse AI backend server.
 * Loads environment variables, connects to MongoDB, then starts Express.
 */

const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

/** Start the HTTP server with a clean error handler */
const startServer = (app, port) => {
  const server = app.listen(port, () => {
    console.log(`\n🔥 WildPulse AI Backend running on port ${port}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${port}/api/health\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${port} is already in use.`);
      console.error(`   Fix: run this command, then restart:\n`);
      console.error(`   npx kill-port ${port}\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
};

// Connect to MongoDB, then start the HTTP server
connectDB()
  .then(() => {
    startServer(app, PORT);
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    console.log('Starting server without database connection...');
    // Start server even if DB fails — weather/FIRMS/risk endpoints still work
    const server = app.listen(PORT, () => {
      console.log(`\n⚠️  WildPulse AI Backend running on port ${PORT} (NO DATABASE)`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Fix: run this in a new terminal, then restart:\n`);
        console.error(`   npx kill-port ${PORT}\n`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  });

