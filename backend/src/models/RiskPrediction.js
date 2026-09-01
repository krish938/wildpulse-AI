/**
 * models/RiskPrediction.js
 * Mongoose model for persisting wildfire risk prediction results.
 *
 * Data Flow:
 * POST /api/risk → riskController → predictRisk() → RiskPrediction.save() → MongoDB Atlas
 *
 * Note: Risk predictions are optional to persist. The riskController computes
 * predictions on every request. This model is used when a caller explicitly
 * wants to save a prediction for later retrieval or audit.
 */

const mongoose = require('mongoose');

// ─── Sub-schema: Environmental Inputs ────────────────────────────────────────
const weatherInputsSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      required: [true, 'Temperature is required'],
      min: [-100, 'Temperature seems unrealistically low'],
      max: [100, 'Temperature seems unrealistically high'],
    },
    humidity: {
      type: Number,
      required: [true, 'Humidity is required'],
      min: [0, 'Humidity cannot be negative'],
      max: [100, 'Humidity cannot exceed 100%'],
    },
    windSpeed: {
      type: Number,
      required: [true, 'Wind speed is required'],
      min: [0, 'Wind speed cannot be negative'],
    },
    precipitation: {
      type: Number,
      default: 0,
      min: [0, 'Precipitation cannot be negative'],
    },
    nearbyFireCount: {
      type: Number,
      default: 0,
      min: [0, 'Nearby fire count cannot be negative'],
    },
  },
  { _id: false } // Don't generate a separate _id for this sub-document
);

// ─── Sub-schema: Individual Factor Scores ────────────────────────────────────
const factorScoresSchema = new mongoose.Schema(
  {
    temperature: { type: Number, min: 0, max: 100 },
    humidity: { type: Number, min: 0, max: 100 },
    windSpeed: { type: Number, min: 0, max: 100 },
    precipitation: { type: Number, min: 0, max: 100 },
    fireActivity: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────
const riskPredictionSchema = new mongoose.Schema(
  {
    // Geographic coordinates for which this prediction was made
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be >= -90'],
        max: [90, 'Latitude must be <= 90'],
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be >= -180'],
        max: [180, 'Longitude must be <= 180'],
      },
      // Optional resolved place name for human readability
      placeName: {
        type: String,
        trim: true,
        maxlength: [200, 'Place name too long'],
      },
    },

    // The computed composite risk score (0–100)
    score: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
    },

    // Categorical risk level derived from the score
    level: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: {
        values: ['LOW', 'MODERATE', 'HIGH', 'EXTREME'],
        message: 'Level must be LOW, MODERATE, HIGH, or EXTREME',
      },
    },

    // Model confidence (0–1)
    confidence: {
      type: Number,
      min: [0, 'Confidence cannot be negative'],
      max: [1, 'Confidence cannot exceed 1'],
      default: 0.65,
    },

    // Snapshot of the environmental inputs used to compute this prediction
    inputs: {
      type: weatherInputsSchema,
      required: [true, 'Input data is required'],
    },

    // Breakdown of each factor's contribution to the overall score
    factorScores: {
      type: factorScoresSchema,
    },

    // Array of human-readable explanation strings (the "explainable AI" output)
    factors: {
      type: [String],
      default: [],
    },

    // One-sentence plain-English summary
    explanation: {
      type: String,
      trim: true,
      maxlength: [500, 'Explanation too long'],
    },

    // Describes the prediction algorithm used (e.g., 'Explainable Scoring Model v1.0')
    modelType: {
      type: String,
      default: 'Explainable Scoring Model v1.0',
      trim: true,
    },

    // Source of the prediction request — useful for analytics
    requestSource: {
      type: String,
      enum: {
        values: ['api', 'frontend', 'batch', 'test'],
        message: 'requestSource must be api, frontend, batch, or test',
      },
      default: 'api',
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,

    // Include virtuals when serializing to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Geospatial-style index for queries by location
riskPredictionSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
// Index on risk level for filtering high-risk predictions
riskPredictionSchema.index({ level: 1 });
// Index on creation time for time-series queries (newest first)
riskPredictionSchema.index({ createdAt: -1 });

// ─── Virtual: Risk colour (derived from level) ────────────────────────────────
riskPredictionSchema.virtual('levelColor').get(function () {
  const colorMap = {
    LOW: '#22c55e',
    MODERATE: '#f59e0b',
    HIGH: '#f97316',
    EXTREME: '#ef4444',
  };
  return colorMap[this.level] || '#6b7280';
});

const RiskPrediction = mongoose.model('RiskPrediction', riskPredictionSchema);

module.exports = RiskPrediction;
