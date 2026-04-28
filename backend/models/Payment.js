const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    month:       { type: String, required: true },   // YYYY-MM
    date:        { type: String, required: true },   // YYYY-MM-DD
    nextPayDate: { type: String, default: '' },      // YYYY-MM-DD (1st of next month)
    rent:        { type: Number, default: 0, min: 0 },
    gas:         { type: Number, default: 0, min: 0 },
    elec:        { type: Number, default: 0, min: 0 },
    service:     { type: Number, default: 0, min: 0 },
    other:       { type: Number, default: 0, min: 0 },
    notes:       { type: String, default: '' },
    total:       { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
