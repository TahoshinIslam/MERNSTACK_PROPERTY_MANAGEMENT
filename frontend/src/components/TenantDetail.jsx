import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TenantDetail({ tenantId, onEdit, onPayment, onReceipt, onBack, onDelete }) {
  const { tenants, payments, paidSet, thisMonth, fmt, initials, avatarColor, totalMonthly, lastPayment, monthsBehind, isOnTime, fmtDate } = useApp();
  const [tab, setTab] = useState('info');

  const t = tenants.find(x => x._id === tenantId);
  if (!t) return null;

  const paid   = paidSet.has(t._id);
  const tPays  = payments
    .filter(p => (p.tenantId?._id || p.tenantId) === tenantId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalPaid = tPays.reduce((s, p) => s + Number(p.total || 0), 0);
  const last     = lastPayment(tenantId);
  const behind   = monthsBehind(t);
  const overdue  = behind >= 2;

  return (
    <div>
      {/* ── Hero ── */}
      <div className="detail-hero">
        <div className="dh-top">
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div className="dh-avatar" style={{ background: avatarColor(t.name) }}>
              {initials(t.name)}
            </div>
            <div>
              <div className="dh-name">{t.name}</div>
              <div className="dh-sub">{t.floor || 'No floor'} · ID: {t._id.slice(-6).toUpperCase()}</div>
              <div className="dh-badges">
                <span className="dh-badge">{paid ? 'Paid this month' : 'Payment pending'}</span>
                <span className="dh-badge">৳{fmt(totalMonthly(t))}/mo</span>
                <span className="dh-badge">
                  Last paid: {last ? `${fmtDate(last.date)} (${last.month})` : 'Never'}
                </span>
                {overdue && (
                  <span className="dh-badge" style={{ background:'rgba(192,57,43,.25)', borderColor:'rgba(192,57,43,.5)', color:'#fff' }}>
                    {behind} months behind
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="dh-actions">
            <button className="btn btn-outline btn-sm" style={{ color:'#fff', borderColor:'rgba(255,255,255,.3)' }} onClick={onEdit}>Edit</button>
            <button className="btn btn-primary btn-sm" onClick={onPayment}>+ Record Payment</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="detail-tabs">
        {['info','financial','history'].map(id => (
          <div
            key={id}
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {id === 'info' && 'Personal Info'}
            {id === 'financial' && 'Financial'}
            {id === 'history' && `Payment History (${tPays.length})`}
          </div>
        ))}
      </div>

      <div className="detail-content">
        {/* ── Personal info ── */}
        {tab === 'info' && (
          <>
            <div className="section-title">Tenant Details</div>
            <div className="info-grid">
              <InfoItem label="Full Name"   val={t.name} />
              <InfoItem label="Phone"       val={t.phone} />
              <InfoItem label="Father"      val={t.father} />
              <InfoItem label="Mother"      val={t.mother} />
              <InfoItem label="Occupation"  val={t.occupation} />
              <InfoItem label="National ID" val={t.nid} />
            </div>
            <div className="section-title">Spouse Details</div>
            <div className="info-grid">
              <InfoItem label="Wife's Name"       val={t.wife} />
              <InfoItem label="Wife's Phone"      val={t.wifePhone} />
              <InfoItem label="Wife's Father"     val={t.wifeFather} />
              <InfoItem label="Wife's Mother"     val={t.wifeMother} />
              <InfoItem label="Wife's Occupation" val={t.wifeOcc} />
              <InfoItem label="Children"          val={t.children} />
            </div>
            {t.notes && <><div className="section-title">Notes</div><p style={{ fontSize:13, color:'var(--text2)' }}>{t.notes}</p></>}
          </>
        )}

        {/* ── Financial ── */}
        {tab === 'financial' && (
          <>
            <div className="section-title">Unit & Lease</div>
            <div className="info-grid">
              <InfoItem label="Floor / Unit"     val={t.floor} />
              <InfoItem label="Move-in Date"     val={t.movein} />
              <InfoItem label="Next Payment Due" val={t.nextpay} highlight />
              <InfoItem label="Advance Paid"     val={`৳${fmt(t.advance)}`} />
              <InfoItem label="Surety Money"     val={`৳${fmt(t.surety)}`} />
            </div>
            <div className="section-title">Monthly Charges</div>
            <div className="info-grid">
              <InfoItem label="Rent"           val={`৳${fmt(t.rent)}`} />
              <InfoItem label="Gas Bill"       val={`৳${fmt(t.gas)}`} />
              <InfoItem label="Electricity"    val={`৳${fmt(t.electricity)}`} />
              <InfoItem label="Service Charge" val={`৳${fmt(t.service)}`} />
            </div>
            <div style={{ background:'var(--accent-light)', borderRadius:10, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:14, fontWeight:500 }}>Total Monthly</span>
              <span style={{ fontSize:22, fontWeight:500, color:'var(--accent)' }}>৳{fmt(totalMonthly(t))}</span>
            </div>
            <div style={{ background:'var(--surface2)', borderRadius:10, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:14, color:'var(--text2)' }}>Total Collected (all time)</span>
              <span style={{ fontSize:18, fontWeight:500 }}>৳{fmt(totalPaid)}</span>
            </div>
          </>
        )}

        {/* ── History ── */}
        {tab === 'history' && (
          tPays.length ? (
            <div className="table-wrap">
            <table className="ptable">
              <thead>
                <tr><th>Month</th><th>Date</th><th>Status</th><th>Rent</th><th>Gas</th><th>Elec</th><th>Service</th><th>Other</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {tPays.map(p => (
                  <tr key={p._id}>
                    <td>{p.month}</td><td>{p.date}</td>
                    <td>
                      <span className={`badge ${isOnTime(p) ? 'badge-green' : 'badge-warn'}`}>
                        {isOnTime(p) ? 'On time' : 'Delayed'}
                      </span>
                    </td>
                    <td>৳{fmt(p.rent)}</td><td>৳{fmt(p.gas)}</td>
                    <td>৳{fmt(p.elec)}</td><td>৳{fmt(p.service)}</td>
                    <td>৳{fmt(p.other)}</td>
                    <td style={{ fontWeight:500 }}>৳{fmt(p.total)}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => onReceipt(p._id)}>Receipt</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="empty">
              <p>No payments recorded yet.</p>
              <button className="btn btn-primary" style={{ marginTop:12 }} onClick={onPayment}>Record First Payment</button>
            </div>
          )
        )}
      </div>

      <div style={{ padding:'0 28px 20px', display:'flex', gap:10 }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back to Tenants</button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete Tenant</button>
      </div>
    </div>
  );
}

function InfoItem({ label, val, highlight }) {
  return (
    <div className="info-item">
      <label>{label}</label>
      <p style={highlight ? { color:'var(--accent)', fontWeight:500 } : {}}>{val || '—'}</p>
    </div>
  );
}
