import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function PaymentModal({ tenantId, onClose, onSuccess }) {
  const { tenants, createPayment, fmt } = useApp();
  const t = tenants.find(x => x._id === tenantId);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm]     = useState({ date: today, other: 0, notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const derivedMonth = (form.date || '').slice(0, 7);

  useEffect(() => {
    if (t) {
      setForm(f => ({
        ...f,
        rent:    Number(t.rent    || 0),
        gas:     Number(t.gas     || 0),
        elec:    Number(t.electricity || 0),
        service: Number(t.service || 0),
      }));
    }
  }, [tenantId]);

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = (form.rent || 0) + (form.gas || 0) + (form.elec || 0) + (form.service || 0) + (form.other || 0);

  const handleSave = async () => {
    if (!form.date) { setError('Please pick a payment date'); return; }
    setSaving(true); setError('');
    try {
      const p = await createPayment({
        tenantId,
        month:   derivedMonth,
        date:    form.date,
        rent:    Number(form.rent    || 0),
        gas:     Number(form.gas     || 0),
        elec:    Number(form.elec    || 0),
        service: Number(form.service || 0),
        other:   Number(form.other   || 0),
        notes:   form.notes,
        total,
      });
      onSuccess(p._id);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  if (!t) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Record Payment</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner">{error}</div>}

          {/* Tenant summary */}
          <div className="pay-summary">
            <h4>{t.name} — {t.floor || 'N/A'}</h4>
            <div className="pay-row"><span>Monthly rent</span><strong>৳{fmt(t.rent)}</strong></div>
            <div className="pay-row">
              <span>Gas + Electricity + Service</span>
              <strong>৳{fmt(Number(t.gas||0) + Number(t.electricity||0) + Number(t.service||0))}</strong>
            </div>
            <div className="pay-row">
              <span>Expected total</span>
              <strong>৳{fmt(Number(t.rent||0) + Number(t.gas||0) + Number(t.electricity||0) + Number(t.service||0))}</strong>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group form-full">
              <label>Payment Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              <small style={{ display:'block', marginTop:4, fontSize:11, color:'var(--text2)' }}>
                Period: <strong>{derivedMonth || '—'}</strong> (derived from the date above)
              </small>
            </div>
            <div className="form-group">
              <label>Rent (BDT)</label>
              <input type="number" value={form.rent} onChange={e => set('rent', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Gas Bill (BDT)</label>
              <input type="number" value={form.gas} onChange={e => set('gas', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Electricity Bill (BDT)</label>
              <input type="number" value={form.elec} onChange={e => set('elec', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Service Charge (BDT)</label>
              <input type="number" value={form.service} onChange={e => set('service', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Other Charges (BDT)</label>
              <input type="number" value={form.other} onChange={e => set('other', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Late fee included" />
            </div>
          </div>

          {/* Live total */}
          <div style={{ marginTop:16, padding:14, background:'var(--surface2)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:500 }}>Total</span>
            <span style={{ fontSize:20, fontWeight:500, color:'var(--accent)' }}>৳{fmt(total)}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save & Generate Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}
