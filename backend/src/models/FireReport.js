/**
 * models/FireReport.js
 * Mongoose model for community-submitted wildfire reports.
 *
 * Data Flow:
 * User fills out the "Report Fire" form →
 * POST /api/reports →
 * ReportsController →
 * FireReport.save() →
 * MongoDB Atlas
 */

const mongoose = require('mongoose');

const fireReportSchema = new mongoose.Schema(
  {
    // Geographic location of the reported fire
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
      // Optional human-readable location name (e.g., "Bandipur Forest, Karnataka")
      placeName: {
        type: String,
        trim: true,
        maxlength: [200, 'Place name too long'],
      },
    },

    // Description of what the reporter observed
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description must be under 2000 characters'],
    },

    // Severity as reported by the user
    severity: {
      type: String,
      enum: {
        values: ['low', 'moderate', 'high', 'extreme'],
        message: 'Severity must be low, moderate, high, or extreme',
      },
      required: [true, 'Severity is required'],
    },

    // Optional: URL to an uploaded image (for future file upload integration)
    imageUrl: {
      type: String,
      default: null,
    },

    // Optional reporter information
    reporter: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name too long'],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
    },

    // Admin-controlled status for the report lifecycle
    status: {
      type: String,
      enum: {
        values: ['pending', 'verified', 'rejected', 'resolved'],
        message: 'Status must be pending, verified, rejected, or resolved',
      },
      default: 'pending',
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,

    // Include virtual fields when converting to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index on location for geospatial-style queries
fireReportSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
// Index on status for filtering by admin
fireReportSchema.index({ status: 1 });
// Index on createdAt for sorting by newest
fireReportSchema.index({ createdAt: -1 });

const FireReport = mongoose.model('FireReport', fireReportSchema);

module.exports = FireReport;
