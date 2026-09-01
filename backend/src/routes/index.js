/**
 * routes/index.js
 * Main router — mounts all sub-routers under /api
 *
 * Data Flow:
 * HTTP Request → app.js → /api → routes/index.js → specific route file → controller → service
 */

const express = require('express');
const router = express.Router();

const healthRoutes = require('./health');
const firesRoutes = require('./fires');
const weatherRoutes = require('./weather');
const riskRoutes = require('./risk');
const reportsRoutes = require('./reports');

// Mount each resource route
router.use('/health', healthRoutes);
router.use('/fires', firesRoutes);
router.use('/weather', weatherRoutes);
router.use('/risk', riskRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;
