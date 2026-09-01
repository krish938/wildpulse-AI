/**
 * controllers/healthController.js
 * Health check endpoint — useful for verifying the server is running.
 */

const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  res.json({
    success: true,
    service: 'WildPulse AI Backend',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStateMap[dbStatus] || 'unknown',
      connected: dbStatus === 1,
    },
    environment: process.env.NODE_ENV || 'development',
    apis: {
      nasaFIRMS: !!process.env.NASA_FIRMS_MAP_KEY ? 'configured' : 'not configured (add NASA_FIRMS_MAP_KEY to .env)',
      openMeteo: 'no key required',
    },
  });
};

module.exports = { getHealth };
