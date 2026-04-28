import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const FLOORS = [
  'Ground Floor - Unit A','Ground Floor - Unit B',
  '1st Floor - Unit A','1st Floor - Unit B',
  '2nd Floor - Unit A','2nd Floor - Unit B',
  '3rd Floor - Unit A','3rd Floor - Unit B',
  '4th Floor - Unit A','4th Floor - Unit B',
  '5th Floor - Unit A','5th Floor - Unit B',
  '6th Floor - Unit A','6th Floor - Unit B',
];

const EMPTY = {
  name:'', father:'', mother:'', phone:'', occupation:'', nid:'',
  wife:'', wifeFather:'', wifeMother:'', wifePhone:'', wifeOcc:'', children:'',
  floor:'', rent:'', movein:'', nextpay:'', advance:'', surety:'',
  gas:'', electricity:'', service:'', notes:'',
};

export default function TenantModal({ editId, onClose }) {
  const { tenants, createTenant, updateTenant, showToast } = useApp();
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (editId) {
      const t = tenants.find(x => x._id === editId);
      if (t) setForm({ ...EMPTY, ...t });
    } else {
      setForm(EMPTY);
    }
  }, [editId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.floor || !form.rent) {
      setError('Please fill required fields (*)'); return;
    }
    setSaving(true); setError('');
    try {
      if (editId) await updateTenant(editId, form);
      else        await createTenant(form);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const F = ({ label, id, type = 'text', placeholder, half }) => (
    <div className={`form-group${!half ? ' form-full' : ''}`} style={half ? {} : {}}>
      <label>{label}</label>
      {type === 'select' ? (
        <select value={form[id]} onChange={e => set(id, e.target.value)}>
          <option value="">Select floor</option>
          {FLOORS.map(f => <option key={f}>{f}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea rows="2" placeholder={placeholder} value={form[id]} onChange={e => set(id, e.target.value)} />
      ) : (
        <input type={type} placeholder={placeholder} value={form[id]} onChange={e => set(id, e.target.value)} />
      )}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{editId ? 'Edit Tenant' : 'Add New Tenant'}</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner">{error}</div>}
          <div className="form-grid">
            <div className="form-section-title">Tenant Information</div>
            <div className="form-group"><label>Full Name *</label><input placeholder="e.g. Mohammad Rahman" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label>Father's Name</label><input value={form.father} onChange={e => set('father', e.target.value)} /></div>
            <div className="form-group"><label>Mother's Name</label><input value={form.mother} onChange={e => set('mother', e.target.value)} /></div>
            <div className="form-group"><label>Phone Number *</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label>Occupation</label><input value={form.occupation} onChange={e => set('occupation', e.target.value)} /></div>
            <div className="form-group"><label>National ID / Passport</label><input value={form.nid} onChange={e => set('nid', e.target.value)} /></div>

            <div className="form-section-title">Spouse Information</div>
            <div className="form-group"><label>Wife's Name</label><input value={form.wife} onChange={e => set('wife', e.target.value)} /></div>
            <div className="form-group"><label>Wife's Father</label><input value={form.wifeFather} onChange={e => set('wifeFather', e.target.value)} /></div>
            <div className="form-group"><label>Wife's Mother</label><input value={form.wifeMother} onChange={e => set('wifeMother', e.target.value)} /></div>
            <div className="form-group"><label>Wife's Phone</label><input value={form.wifePhone} onChange={e => set('wifePhone', e.target.value)} /></div>
            <div className="form-group"><label>Wife's Occupation</label><input value={form.wifeOcc} onChange={e => set('wifeOcc', e.target.value)} /></div>
            <div className="form-group form-full"><label>Children's Names</label><input placeholder="e.g. Rahim (8), Karim (5)" value={form.children} onChange={e => set('children', e.target.value)} /></div>

            <div className="form-section-title">Unit & Financial</div>
            <div className="form-group">
              <label>Floor *</label>
              <select value={form.floor} onChange={e => set('floor', e.target.value)}>
                <option value="">Select floor</option>
                {FLOORS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Monthly Rent (BDT) *</label><input type="number" value={form.rent} onChange={e => set('rent', e.target.value)} /></div>
            <div className="form-group">
              <label>Move-in Date</label>
              <input type="date" value={form.movein} onChange={e => set('movein', e.target.value)} />
              <small style={{ display:'block', marginTop:4, fontSize:11, color:'var(--text2)' }}>
                Billing cycle anchors to this day. Next due is auto-computed.
              </small>
            </div>
            <div className="form-group">
              <label>Advance Payment (BDT)</label>
              <input type="number" value={form.advance} onChange={e => set('advance', e.target.value)} />
              <small style={{ display:'block', marginTop:4, fontSize:11, color:'var(--text2)' }}>
                Each full month of rent in advance shifts the next due date forward by one cycle.
              </small>
            </div>
            <div className="form-group"><label>Surety Money (BDT)</label><input type="number" value={form.surety} onChange={e => set('surety', e.target.value)} /></div>
            <div className="form-group"><label>Gas Bill (BDT/mo)</label><input type="number" value={form.gas} onChange={e => set('gas', e.target.value)} /></div>
            <div className="form-group"><label>Electricity (BDT/mo)</label><input type="number" value={form.electricity} onChange={e => set('electricity', e.target.value)} /></div>
            <div className="form-group"><label>Service Charge (BDT/mo)</label><input type="number" value={form.service} onChange={e => set('service', e.target.value)} /></div>
            <div className="form-group form-full"><label>Notes</label><textarea rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update Tenant' : 'Save Tenant'}
          </button>
        </div>
      </div>
    </div>
  );
}
