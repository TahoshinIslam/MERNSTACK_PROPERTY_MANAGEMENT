const router  = require('express').Router();
const Payment = require('../models/Payment');
const Tenant  = require('../models/Tenant');

/** First day of next calendar month from a YYYY-MM string */
function nextMonthFirst(month) {
  if (!month) return '';
  const [y, m] = month.split('-').map(Number);
  const nm = m === 12 ? 1  : m + 1;
  const ny = m === 12 ? y + 1 : y;
  return `${ny}-${String(nm).padStart(2, '0')}-01`;
}

/**
 * Per-tenant cycle:
 *  - cycle 0 = move-in month (covered by signing payment, not tracked here)
 *  - cycle 1..advanceMonths = covered by `tenant.advance`
 *  - cycle (advanceMonths+1).. = covered by recorded Payment rows
 * Returns the next cycle's due date as YYYY-MM-DD, anchored to move-in day.
 */
function nextDueDateFromCycle(moveinStr, advanceMonths, paymentsCount) {
  if (!moveinStr) return '';
  const [y, m, d] = moveinStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCMonth(dt.getUTCMonth() + 1 + advanceMonths + paymentsCount);
  return dt.toISOString().slice(0, 10);
}

async function recomputeTenantNextPay(tenantId) {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) return null;
  const rent          = Number(tenant.rent || 0);
  const advance       = Number(tenant.advance || 0);
  const advanceMonths = rent > 0 ? Math.floor(advance / rent) : 0;
  const count         = await Payment.countDocuments({ tenantId });
  const next          = nextDueDateFromCycle(tenant.movein, advanceMonths, count);
  if (next) await Tenant.findByIdAndUpdate(tenantId, { nextpay: next });
  return next;
}

// ── GET /api/payments  (optionally ?month=YYYY-MM) ────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = req.query.month ? { month: req.query.month } : {};
    const payments = await Payment.find(filter)
      .populate('tenantId', 'name floor phone movein')
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/tenant/:tenantId ───────────────────────────────────────
router.get('/tenant/:tenantId', async (req, res) => {
  try {
    const payments = await Payment.find({ tenantId: req.params.tenantId }).sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('tenantId');
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const nextPayDate = nextMonthFirst(req.body.month);
    const payment     = new Payment({ ...req.body, nextPayDate });
    const saved       = await payment.save();
    const tenantNextPay = await recomputeTenantNextPay(req.body.tenantId);
    res.status(201).json({ ...saved.toObject(), tenantNextPay });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/payments/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    await recomputeTenantNextPay(payment.tenantId);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.recomputeTenantNextPay = recomputeTenantNextPay;
