const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    // ── Primary tenant ────────────────────────────────────────────────────────
    name:        { type: String, required: true, trim: true },
    father:      { type: String, trim: true, default: '' },
    mother:      { type: String, trim: true, default: '' },
    phone:       { type: String, required: true, trim: true },
    occupation:  { type: String, trim: true, default: '' },
    nid:         { type: String, trim: true, default: '' },

    // ── Spouse info ───────────────────────────────────────────────────────────
    wife:        { type: String, trim: true, default: '' },
    wifeFather:  { type: String, trim: true, default: '' },
    wifeMother:  { type: String, trim: true, default: '' },
    wifePhone:   { type: String, trim: true, default: '' },
    wifeOcc:     { type: String, trim: true, default: '' },
    children:    { type: String, trim: true, default: '' },

    // ── Unit & financial ──────────────────────────────────────────────────────
    floor:       { type: String, required: true },
    rent:        { type: Number, required: true, min: 0 },
    movein:      { type: String, default: '' },   // YYYY-MM-DD
    nextpay:     { type: String, default: '' },   // YYYY-MM-DD (auto-updated on payment)
    advance:     { type: Number, default: 0, min: 0 },
    surety:      { type: Number, default: 0, min: 0 },
    gas:         { type: Number, default: 0, min: 0 },
    electricity: { type: Number, default: 0, min: 0 },
    service:     { type: Number, default: 0, min: 0 },
    notes:       { type: String, default: '' },
  },
  { timestamps: true }
);

// Virtual: total monthly charge
tenantSchema.virtual('totalMonthly').get(function () {
  return (
    (this.rent || 0) +
    (this.gas || 0) +
    (this.electricity || 0) +
    (this.service || 0)
  );
});

tenantSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tenant', tenantSchema);
