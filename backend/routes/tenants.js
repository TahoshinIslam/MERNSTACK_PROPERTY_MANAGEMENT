const router  = require('express').Router();
const Tenant  = require('../models/Tenant');
const Payment = require('../models/Payment');
const { recomputeTenantNextPay } = require('./payments');

// ── GET /api/tenants ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { floor } = req.query;
    const filter = floor ? { floor: { $regex: new RegExp(`^${floor}`, 'i') } } : {};
    const tenants = await Tenant.find(filter).sort({ createdAt: -1 });
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tenants/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/tenants ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const tenant = new Tenant(req.body);
    const saved  = await tenant.save();
    await recomputeTenantNextPay(saved._id);
    const fresh = await Tenant.findById(saved._id);
    res.status(201).json(fresh);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT /api/tenants/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    await recomputeTenantNextPay(tenant._id);
    const fresh = await Tenant.findById(tenant._id);
    res.json(fresh);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/tenants/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findByIdAndDelete(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    // Cascade-delete payments
    await Payment.deleteMany({ tenantId: req.params.id });
    res.json({ message: 'Tenant and all related payments deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
